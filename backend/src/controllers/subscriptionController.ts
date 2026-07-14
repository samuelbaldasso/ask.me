import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  createCheckoutSession,
  getSubscriptionStatus,
  constructWebhookEvent,
  handleWebhookEvent,
  SubscriptionServiceError,
} from '../services/subscriptionService';

export async function createCheckoutSessionController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // authenticate() garante req.user presente nesta rota
    const result = await createCheckoutSession(req.user!.sub);
    res.status(StatusCodes.OK).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getSubscriptionStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await getSubscriptionStatus(req.user!.sub);
    res.status(StatusCodes.OK).json(result);
  } catch (err) {
    next(err);
  }
}

export async function stripeWebhookController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const signature = req.headers['stripe-signature'];

    if (typeof signature !== 'string') {
      res.status(StatusCodes.BAD_REQUEST).json({ error: 'Assinatura do webhook ausente' });
      return;
    }

    // req.body é um Buffer aqui — a rota usa express.raw(), não express.json()
    const event = constructWebhookEvent(req.body as Buffer, signature);
    await handleWebhookEvent(event);

    res.status(StatusCodes.OK).json({ received: true });
  } catch (err) {
    if (err instanceof SubscriptionServiceError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}
