import request from 'supertest';
import app from '../../src/app';

describe('POST /api/v1/auth/google', () => {
  it('retorna 422 sem idToken', async () => {
    const res = await request(app).post('/api/v1/auth/google').send({});
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });

  it('retorna 503 quando GOOGLE_CLIENT_ID não está configurado no servidor', async () => {
    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'some-token' });

    expect(res.status).toBe(503);
  });
});
