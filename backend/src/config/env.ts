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

  // Auth social (Google Sign-In) — Fase de monetização.
  // GOOGLE_CLIENT_ID é o Web Client ID (usado como serverClientId no app,
  // audience padrão). GOOGLE_IOS_CLIENT_ID é o Client ID do tipo iOS — o
  // idToken emitido pelo GoogleSignIn no iOS tem esse client como audience
  // (não o serverClientId), então o backend precisa aceitar ambos.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_IOS_CLIENT_ID: z.string().optional(),

  // Stripe (assinatura mensal, cartão de crédito)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_MONTHLY: z.string().optional(),
  // URLs para onde o Stripe Checkout redireciona após sucesso/cancelamento.
  // Hoje apontam para a página /subscription do site web (Vercel); o app
  // mobile, quando existir em produção, deve sobrescrever com deep link
  // (ex: askme://subscription/success) via variável de ambiente própria.
  STRIPE_CHECKOUT_SUCCESS_URL: z
    .string()
    .default('https://www.ask-me.company/subscription'),
  STRIPE_CHECKOUT_CANCEL_URL: z
    .string()
    .default('https://www.ask-me.company/subscription'),
  // Para onde o Stripe Billing Portal (gerenciar/cancelar assinatura) retorna
  // o usuário depois que ele fecha o portal.
  STRIPE_BILLING_PORTAL_RETURN_URL: z
    .string()
    .default('https://www.ask-me.company/subscription'),

  // Origem permitida no CORS da API (o site web em produção). Em dev, cai
  // para localhost para não quebrar o front rodando local.
  ALLOWED_ORIGIN: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
