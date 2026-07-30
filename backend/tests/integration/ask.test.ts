import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import { env } from '../../src/config/env';

/**
 * Testes de integração — requerem banco PostgreSQL rodando (ver places.test.ts).
 * Sem ANTHROPIC_API_KEY configurada, o endpoint cai para busca tradicional
 * (comportamento coberto aqui sem precisar mockar a IA).
 *
 * /ask exige autenticação + assinatura ativa (ver middleware/auth.ts) — os
 * testes de validação de payload usam um token de um usuário com assinatura
 * ativa para chegar até a validação do zod.
 */

const HAS_TEST_DB = process.env.DATABASE_URL?.includes('test');
const itWithDb = HAS_TEST_DB ? it : it.skip;

async function createActiveSubscriberToken(): Promise<string> {
  const { prisma } = await import('../../src/db/prisma');
  const user = await prisma.user.create({
    data: {
      email: `ask-test-${Date.now()}@example.com`,
      googleId: `ask-test-google-${Date.now()}`,
    },
  });
  await prisma.subscription.create({
    data: {
      userId: user.id,
      stripeCustomerId: `cus_test_${user.id}`,
      status: 'active',
    },
  });
  return jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: '1h' });
}

describe('POST /api/v1/ask', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app)
      .post('/api/v1/ask')
      .send({ query: 'sushi perto de mim', lat: -23.5505, lng: -46.6333 });
    expect(res.status).toBe(401);
  });

  itWithDb('retorna 402 quando o usuário não tem assinatura ativa', async () => {
    const { prisma } = await import('../../src/db/prisma');
    const user = await prisma.user.create({
      data: {
        email: `ask-test-free-${Date.now()}@example.com`,
        googleId: `ask-test-free-google-${Date.now()}`,
      },
    });
    const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app)
      .post('/api/v1/ask')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'sushi perto de mim', lat: -23.5505, lng: -46.6333 });

    expect(res.status).toBe(402);
    expect(res.body.code).toBe('SUBSCRIPTION_REQUIRED');
  });

  itWithDb('retorna 422 sem query', async () => {
    const token = await createActiveSubscriberToken();
    const res = await request(app)
      .post('/api/v1/ask')
      .set('Authorization', `Bearer ${token}`)
      .send({ lat: -23.5505, lng: -46.6333 });
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('details');
  });

  itWithDb('retorna 422 sem lat/lng', async () => {
    const token = await createActiveSubscriberToken();
    const res = await request(app)
      .post('/api/v1/ask')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'sushi perto de mim' });
    expect(res.status).toBe(422);
  });

  itWithDb('retorna 422 com lat fora do intervalo', async () => {
    const token = await createActiveSubscriberToken();
    const res = await request(app)
      .post('/api/v1/ask')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'sushi perto de mim', lat: 999, lng: -46.6333 });
    expect(res.status).toBe(422);
  });

  itWithDb(
    'retorna 200 e cai para busca tradicional quando ANTHROPIC_API_KEY não está configurada',
    async () => {
      const token = await createActiveSubscriberToken();
      const res = await request(app)
        .post('/api/v1/ask')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'sushi perto de mim', lat: -23.5505, lng: -46.6333 });

      expect(res.status).toBe(200);
      expect(res.body.usedAi).toBe(false);
      expect(res.body).toHaveProperty('answer');
      expect(res.body.results).toHaveProperty('data');
      expect(Array.isArray(res.body.results.data)).toBe(true);
    },
  );
});
