import { env } from '../../src/config/env';

const stripeInstanceMock = {
  customers: { create: jest.fn() },
  checkout: { sessions: { create: jest.fn() } },
  subscriptions: { retrieve: jest.fn() },
  webhooks: { constructEvent: jest.fn() },
  billingPortal: { sessions: { create: jest.fn() } },
};

jest.mock('stripe', () => jest.fn().mockImplementation(() => stripeInstanceMock));

jest.mock('../../src/db/prisma', () => ({
  prisma: {
    subscription: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    user: { findUniqueOrThrow: jest.fn() },
  },
}));

import { prisma } from '../../src/db/prisma';
import {
  createCheckoutSession,
  createBillingPortalSession,
  getSubscriptionStatus,
  handleWebhookEvent,
  SubscriptionServiceError,
} from '../../src/services/subscriptionService';

describe('subscriptionService', () => {
  const originalSecretKey = env.STRIPE_SECRET_KEY;
  const originalPriceId = env.STRIPE_PRICE_ID_MONTHLY;

  beforeEach(() => {
    jest.clearAllMocks();
    (env as { STRIPE_SECRET_KEY?: string }).STRIPE_SECRET_KEY = 'sk_test_fake';
    (env as { STRIPE_PRICE_ID_MONTHLY?: string }).STRIPE_PRICE_ID_MONTHLY = 'price_fake';
  });

  afterAll(() => {
    (env as { STRIPE_SECRET_KEY?: string }).STRIPE_SECRET_KEY = originalSecretKey;
    (env as { STRIPE_PRICE_ID_MONTHLY?: string }).STRIPE_PRICE_ID_MONTHLY = originalPriceId;
  });

  describe('createCheckoutSession', () => {
    it('lança 503 quando STRIPE_PRICE_ID_MONTHLY não está configurado', async () => {
      (env as { STRIPE_PRICE_ID_MONTHLY?: string }).STRIPE_PRICE_ID_MONTHLY = undefined;

      await expect(createCheckoutSession('user-1')).rejects.toMatchObject({
        statusCode: 503,
      } satisfies Partial<SubscriptionServiceError>);
    });

    it('cria customer novo quando usuário ainda não tem assinatura local', async () => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Usuária',
      });
      stripeInstanceMock.customers.create.mockResolvedValue({ id: 'cus_123' });
      (prisma.subscription.create as jest.Mock).mockResolvedValue({});
      stripeInstanceMock.checkout.sessions.create.mockResolvedValue({
        url: 'https://checkout.stripe.com/session_abc',
      });

      const result = await createCheckoutSession('user-1');

      expect(stripeInstanceMock.customers.create).toHaveBeenCalled();
      expect(stripeInstanceMock.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          payment_method_types: ['card'],
          customer: 'cus_123',
        }),
      );
      expect(result.url).toBe('https://checkout.stripe.com/session_abc');
    });

    it('reaproveita customer existente sem criar um novo', async () => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        stripeCustomerId: 'cus_existing',
      });
      stripeInstanceMock.checkout.sessions.create.mockResolvedValue({
        url: 'https://checkout.stripe.com/session_xyz',
      });

      await createCheckoutSession('user-1');

      expect(stripeInstanceMock.customers.create).not.toHaveBeenCalled();
      expect(stripeInstanceMock.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({ customer: 'cus_existing' }),
      );
    });
  });

  describe('createBillingPortalSession', () => {
    it('lança 404 quando o usuário não tem assinatura', async () => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(createBillingPortalSession('user-1')).rejects.toMatchObject({
        statusCode: 404,
      } satisfies Partial<SubscriptionServiceError>);
    });

    it('cria a portal session com o customer existente', async () => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        stripeCustomerId: 'cus_existing',
      });
      stripeInstanceMock.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/session_abc',
      });

      const result = await createBillingPortalSession('user-1');

      expect(stripeInstanceMock.billingPortal.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({ customer: 'cus_existing' }),
      );
      expect(result.url).toBe('https://billing.stripe.com/session_abc');
    });
  });

  describe('getSubscriptionStatus', () => {
    it("retorna status 'none' quando o usuário nunca iniciou checkout", async () => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getSubscriptionStatus('user-1');

      expect(result).toEqual({ status: 'none' });
    });

    it('retorna os dados da assinatura quando ela existe', async () => {
      const periodEnd = new Date('2026-08-01T00:00:00Z');
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        status: 'active',
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      });

      const result = await getSubscriptionStatus('user-1');

      expect(result).toEqual({
        status: 'active',
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      });
    });
  });

  describe('handleWebhookEvent', () => {
    it('sincroniza a assinatura local em checkout.session.completed', async () => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({ id: 'sub-local-1' });
      stripeInstanceMock.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_stripe_1',
        status: 'active',
        cancel_at_period_end: false,
        items: {
          data: [{ price: { id: 'price_fake' }, current_period_end: 1_800_000_000 }],
        },
      });
      (prisma.subscription.update as jest.Mock).mockResolvedValue({});

      await handleWebhookEvent({
        type: 'checkout.session.completed',
        data: {
          object: {
            mode: 'subscription',
            subscription: 'sub_stripe_1',
            customer: 'cus_123',
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-local-1' },
          data: expect.objectContaining({ status: 'active', stripeSubscriptionId: 'sub_stripe_1' }),
        }),
      );
    });

    it('ignora eventos que não são relevantes para assinatura', async () => {
      await handleWebhookEvent({
        type: 'payment_intent.succeeded',
        data: { object: {} },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('não falha quando o customer do evento não tem assinatura local (ex: teste manual no dashboard)', async () => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        handleWebhookEvent({
          type: 'customer.subscription.updated',
          data: { object: { id: 'sub_x', customer: 'cus_unknown' } },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any),
      ).resolves.toBeUndefined();

      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });
  });
});
