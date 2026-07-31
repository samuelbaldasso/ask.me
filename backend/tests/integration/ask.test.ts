import request from 'supertest';
import app from '../../src/app';

/**
 * Testes de integração — requerem banco PostgreSQL rodando (ver places.test.ts).
 * Sem ANTHROPIC_API_KEY configurada, o endpoint cai para busca tradicional
 * (comportamento coberto aqui sem precisar mockar a IA).
 *
 * /ask é público — sem login, sem assinatura (ver routes/ask.ts). A busca
 * por IA deixou de ser benefício pago quando a monetização virou B2B.
 */

const HAS_TEST_DB = process.env.DATABASE_URL?.includes('test');
const itWithDb = HAS_TEST_DB ? it : it.skip;

describe('POST /api/v1/ask', () => {
  it('retorna 422 sem query', async () => {
    const res = await request(app)
      .post('/api/v1/ask')
      .send({ lat: -23.5505, lng: -46.6333 });
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('details');
  });

  it('retorna 422 sem lat/lng', async () => {
    const res = await request(app)
      .post('/api/v1/ask')
      .send({ query: 'sushi perto de mim' });
    expect(res.status).toBe(422);
  });

  it('retorna 422 com lat fora do intervalo', async () => {
    const res = await request(app)
      .post('/api/v1/ask')
      .send({ query: 'sushi perto de mim', lat: 999, lng: -46.6333 });
    expect(res.status).toBe(422);
  });

  itWithDb(
    'retorna 200 sem token e cai para busca tradicional quando ANTHROPIC_API_KEY não está configurada',
    async () => {
      const res = await request(app)
        .post('/api/v1/ask')
        .send({ query: 'sushi perto de mim', lat: -23.5505, lng: -46.6333 });

      expect(res.status).toBe(200);
      expect(res.body.usedAi).toBe(false);
      expect(res.body).toHaveProperty('answer');
      expect(res.body.results).toHaveProperty('data');
      expect(Array.isArray(res.body.results.data)).toBe(true);
    },
  );
});
