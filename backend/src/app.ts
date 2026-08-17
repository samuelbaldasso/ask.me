import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import router from './routes';
import { errorHandler } from './middleware/errorHandler';
import { stripeWebhookController } from './controllers/subscriptionController';

const app: Application = express();

// Confia apenas no primeiro hop (proxy de borda do Railway) para resolver o
// IP real do cliente via X-Forwarded-For — necessário para o rate limiting
// funcionar corretamente atrás de um proxy reverso.
app.set('trust proxy', 1);

// ── Segurança e parsing ───────────────────────────────────────────────────────
app.use(helmet());
// Restrito à origem do site web — a auth é via JWT no header Authorization
// (não cookie), então apps mobile/nativos não passam por CORS de qualquer forma.
app.use(cors({ origin: env.ALLOWED_ORIGIN }));

// Webhook da Stripe precisa do corpo bruto (raw) para validar a assinatura
// HMAC — deve ser registrado ANTES do express.json() global, que já teria
// parseado/consumido o body como JSON.
app.post(
  '/api/v1/subscriptions/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookController,
);

app.use(express.json({ limit: '256kb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rotas da API ──────────────────────────────────────────────────────────────
app.use('/api/v1', router);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ── Error handler (deve ser o último middleware) ──────────────────────────────
app.use(errorHandler);

export default app;
