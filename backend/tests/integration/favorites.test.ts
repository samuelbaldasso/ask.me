import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import { env } from '../../src/config/env';

const HAS_TEST_DB = process.env.DATABASE_URL?.includes('test');
const itWithDb = HAS_TEST_DB ? it : it.skip;

function tokenFor(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '1h' });
}

describe('rotas de favoritos', () => {
  describe('GET /api/v1/favorites', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).get('/api/v1/favorites').query({ lat: '-23.5', lng: '-46.6' });
      expect(res.status).toBe(401);
    });

    it('retorna 422 sem lat/lng', async () => {
      const res = await request(app)
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${tokenFor('user-fake-id')}`);
      expect(res.status).toBe(422);
    });

    itWithDb('retorna 200 com lat/lng válidos', async () => {
      const res = await request(app)
        .get('/api/v1/favorites')
        .query({ lat: '-23.5505', lng: '-46.6333' })
        .set('Authorization', `Bearer ${tokenFor('user-fake-id')}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/favorites', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).post('/api/v1/favorites').send({ placeId: 'place-1' });
      expect(res.status).toBe(401);
    });

    it('retorna 422 sem placeId', async () => {
      const res = await request(app)
        .post('/api/v1/favorites')
        .set('Authorization', `Bearer ${tokenFor('user-fake-id')}`)
        .send({});
      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /api/v1/favorites/:placeId', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).delete('/api/v1/favorites/place-1');
      expect(res.status).toBe(401);
    });
  });
});
