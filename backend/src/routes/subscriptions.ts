import { Router, IRouter } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createCheckoutSessionController,
  createBillingPortalSessionController,
  getSubscriptionStatusController,
} from '../controllers/subscriptionController';

const router: IRouter = Router();

/**
 * POST /subscriptions/checkout
 * Requer autenticação. Cria uma Stripe Checkout Session (assinatura mensal,
 * cartão de crédito) e retorna a URL hospedada pela Stripe para o app abrir.
 */
router.post('/checkout', authenticate, createCheckoutSessionController);

/**
 * GET /subscriptions/me
 * Requer autenticação. Retorna o status atual da assinatura do usuário.
 */
router.get('/me', authenticate, getSubscriptionStatusController);

/**
 * POST /subscriptions/portal
 * Requer autenticação. Cria uma Stripe Billing Portal session (cancelar,
 * trocar cartão, ver faturas) e retorna a URL hospedada pela Stripe.
 */
router.post('/portal', authenticate, createBillingPortalSessionController);

export default router;
