import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import { env } from '../../src/config/env';

const HAS_TEST_DB = process.env.DATABASE_URL?.includes('test');
const itWithDb = HAS_TEST_DB ? it : it.skip;

describe('rotas de assinatura', () => {
  describe('POST /api/v1/subscriptions/checkout', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).post('/api/v1/subscriptions/checkout');
      expect(res.status).toBe(401);
    });

    it('retorna 401 com token inválido', async () => {
      const res = await request(app)
        .post('/api/v1/subscriptions/checkout')
        .set('Authorization', 'Bearer token-invalido');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/subscriptions/me', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).get('/api/v1/subscriptions/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/subscriptions/portal', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).post('/api/v1/subscriptions/portal');
      expect(res.status).toBe(401);
    });

    itWithDb('retorna 404 quando o usuário não tem assinatura', async () => {
      const token = jwt.sign({ sub: 'user-fake-id' }, env.JWT_SECRET, { expiresIn: '1h' });

      const res = await request(app)
        .post('/api/v1/subscriptions/portal')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/subscriptions/webhook', () => {
    it('retorna 400 sem cabeçalho stripe-signature', async () => {
      const res = await request(app).post('/api/v1/subscriptions/webhook').send({});
      expect(res.status).toBe(400);
    });

    it('retorna 503 quando STRIPE_WEBHOOK_SECRET não está configurado', async () => {
      const res = await request(app)
        .post('/api/v1/subscriptions/webhook')
        .set('stripe-signature', 'fake-signature')
        .set('Content-Type', 'application/json')
        .send(Buffer.from('{}'));

      expect(res.status).toBe(503);
    });
  });

  // Requer JWT válido — usuário não precisa existir no banco para o
  // middleware `authenticate` aceitar o token (validação de existência
  // acontece na camada de serviço).
  it('token JWT válido passa pelo middleware de autenticação', async () => {
    const token = jwt.sign({ sub: 'user-fake-id' }, env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app)
      .post('/api/v1/subscriptions/checkout')
      .set('Authorization', `Bearer ${token}`);

    // Sem STRIPE_PRICE_ID_MONTHLY configurado, a rota chega no serviço e
    // falha com 503 — não com 401 — confirmando que passou pela auth.
    expect(res.status).not.toBe(401);
  });
});
