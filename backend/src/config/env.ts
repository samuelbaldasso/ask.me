import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL válida'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET deve ter no mínimo 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Auth social (Google Sign-In) — Fase de monetização
  GOOGLE_CLIENT_ID: z.string().optional(),

  // Stripe (assinatura mensal, cartão de crédito)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_MONTHLY: z.string().optional(),
  // URLs para onde o Stripe Checkout redireciona após sucesso/cancelamento.
  // Em produção, apontam para um deep link do app (ex: askme://subscription/success).
  STRIPE_CHECKOUT_SUCCESS_URL: z.string().default('askme://subscription/success'),
  STRIPE_CHECKOUT_CANCEL_URL: z.string().default('askme://subscription/cancel'),
  // Para onde o Stripe Billing Portal (gerenciar/cancelar assinatura) retorna
  // o usuário depois que ele fecha o portal.
  STRIPE_BILLING_PORTAL_RETURN_URL: z.string().default('askme://subscription/return'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
