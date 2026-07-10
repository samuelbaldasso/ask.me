import request from 'supertest';
import app from '../../src/app';

/**
 * Testes de integração — requerem banco PostgreSQL rodando.
 * Variável de ambiente: DATABASE_URL (apontando para banco de teste).
 *
 * Para rodar localmente:
 *   docker-compose up -d
 *   DATABASE_URL=... npm run test:integration
 *
 * Os testes usam dados do seed (src/db/seed.ts).
 * Em CI, o banco é criado e populado antes desta suite.
 */

const HAS_TEST_DB = process.env.DATABASE_URL?.includes('test');
// Usa it.skip (em vez de um early-return dentro do teste) para que a suíte
// reporte explicitamente "skipped" quando não houver banco de teste, ao
// invés de aparentar sucesso sem nunca exercitar a query espacial.
const itWithDb = HAS_TEST_DB ? it : it.skip;

describe('GET /api/v1/places', () => {
  itWithDb('retorna 200 com parâmetros válidos', async () => {
    const res = await request(app)
      .get('/api/v1/places')
      .query({ lat: '-23.5505', lng: '-46.6333', radius: '2000' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('offset');
  });

  it('retorna 422 sem lat/lng', async () => {
    const res = await request(app).get('/api/v1/places');
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('details');
  });

  it('retorna 422 com lat inválida', async () => {
    const res = await request(app)
      .get('/api/v1/places')
      .query({ lat: '999', lng: '-46.6333' });

    expect(res.status).toBe(422);
  });

  it('health check retorna 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
