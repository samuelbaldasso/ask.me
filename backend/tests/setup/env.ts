// Garante que src/config/env.ts (validado com zod, obrigatório) tenha valores
// mínimos ao rodar testes unitários fora de um ambiente com .env configurado.
// Nunca sobrescreve variáveis já definidas (ex: DATABASE_URL real em CI/integração).
process.env.DATABASE_URL ??= 'postgresql://askme:askme_pass@localhost:5432/askme_test';
process.env.JWT_SECRET ??= 'test_jwt_secret_min_16_chars';

// Zera provedores externos opcionais mesmo que o .env local tenha chaves
// reais configuradas (ex: para rodar o app localmente) — os testes de
// integração para "provedor não configurado" (401/503) dependem de estarem
// vazios. `env.ts` roda `dotenv.config()`, que NUNCA sobrescreve uma env var
// já definida — então setar para string vazia aqui, antes de qualquer
// import de `src/config/env`, garante o estado determinístico.
process.env.GOOGLE_CLIENT_ID = '';
process.env.STRIPE_WEBHOOK_SECRET = '';
process.env.STRIPE_SECRET_KEY = '';
process.env.STRIPE_PRICE_ID_MONTHLY = '';
process.env.ANTHROPIC_API_KEY = '';
process.env.GOOGLE_PLACES_API_KEY = '';
