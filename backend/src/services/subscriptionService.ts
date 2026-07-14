import Stripe from 'stripe';
import { SubscriptionStatus } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../db/prisma';

const KNOWN_STATUSES = new Set<string>(Object.values(SubscriptionStatus));

function toSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  return KNOWN_STATUSES.has(stripeStatus)
    ? (stripeStatus as SubscriptionStatus)
    : SubscriptionStatus.incomplete;
}

class SubscriptionServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

let stripeClient: Stripe | null = null;

/**
 * Cliente Stripe é instanciado sob demanda (não no import) para permitir
 * rodar o servidor/testes sem a chave configurada — chamadas que dependem
 * dela falham com erro claro em vez de derrubar o processo no boot.
 */
function getStripeClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new SubscriptionServiceError('Stripe não está configurado no servidor', 503);
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

/**
 * Garante que o usuário tem um Stripe Customer associado, criando um se
 * ainda não existir. Reaproveita o registro de Subscription (mesmo antes
 * de haver uma assinatura ativa) para guardar o customerId.
 */
async function ensureStripeCustomer(userId: string): Promise<string> {
  const existing = await prisma.subscription.findUnique({ where: { userId } });

  if (existing) {
    return existing.stripeCustomerId;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const stripe = getStripeClient();

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id },
  });

  await prisma.subscription.create({
    data: {
      userId: user.id,
      stripeCustomerId: customer.id,
    },
  });

  return customer.id;
}

/**
 * Cria uma Stripe Checkout Session em modo assinatura (cartão de crédito,
 * renovação automática mensal). Pix não é suportado aqui — ver nota no
 * schema.prisma sobre a limitação de débito recorrente via Pix na Stripe.
 */
export async function createCheckoutSession(userId: string): Promise<{ url: string }> {
  if (!env.STRIPE_PRICE_ID_MONTHLY) {
    throw new SubscriptionServiceError('Plano de assinatura não configurado no servidor', 503);
  }

  const stripe = getStripeClient();
  const customerId = await ensureStripeCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: env.STRIPE_PRICE_ID_MONTHLY, quantity: 1 }],
    success_url: env.STRIPE_CHECKOUT_SUCCESS_URL,
    cancel_url: env.STRIPE_CHECKOUT_CANCEL_URL,
  });

  if (!session.url) {
    throw new SubscriptionServiceError('Falha ao criar sessão de checkout', 502);
  }

  return { url: session.url };
}

export async function getSubscriptionStatus(userId: string) {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });

  if (!subscription) {
    return { status: 'none' as const };
  }

  return {
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  };
}

/**
 * Verifica a assinatura do webhook e retorna o evento. Lança erro em caso
 * de payload/assinatura inválidos — o caller deve responder 400.
 */
export function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new SubscriptionServiceError('Webhook do Stripe não está configurado', 503);
  }

  const stripe = getStripeClient();

  try {
    return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new SubscriptionServiceError('Assinatura de webhook inválida', 400);
  }
}

/**
 * Aplica o efeito de um evento de webhook do Stripe no estado local da
 * assinatura. Eventos não relevantes são ignorados silenciosamente —
 * a Stripe reenvia todos os tipos de evento para o mesmo endpoint.
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'subscription' || !session.subscription || !session.customer) {
        return;
      }
      await syncSubscriptionFromStripe(
        session.customer as string,
        session.subscription as string,
      );
      return;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const stripeSubscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionFromStripe(
        stripeSubscription.customer as string,
        stripeSubscription.id,
      );
      return;
    }

    default:
      return;
  }
}

async function syncSubscriptionFromStripe(
  stripeCustomerId: string,
  stripeSubscriptionId: string,
): Promise<void> {
  const localSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId },
  });

  if (!localSubscription) {
    return;
  }

  const stripe = getStripeClient();
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  const currentPeriodEndTimestamp = stripeSubscription.items.data[0]?.current_period_end;

  await prisma.subscription.update({
    where: { id: localSubscription.id },
    data: {
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: stripeSubscription.items.data[0]?.price.id,
      status: toSubscriptionStatus(stripeSubscription.status),
      currentPeriodEnd: currentPeriodEndTimestamp
        ? new Date(currentPeriodEndTimestamp * 1000)
        : null,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });
}

export { SubscriptionServiceError };
