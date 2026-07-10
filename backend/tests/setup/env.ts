// Garante que src/config/env.ts (validado com zod, obrigatório) tenha valores
// mínimos ao rodar testes unitários fora de um ambiente com .env configurado.
// Nunca sobrescreve variáveis já definidas (ex: DATABASE_URL real em CI/integração).
process.env.DATABASE_URL ??= 'postgresql://askme:askme_pass@localhost:5432/askme_test';
process.env.JWT_SECRET ??= 'test_jwt_secret_min_16_chars';
