import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import { env } from '../../src/config/env';

/**
 * Testes de integração — requerem banco PostgreSQL rodando (ver places.test.ts).
 * Cobre o painel do lojista (claim, edição de perfil, relatório de eventos)
 * e o endpoint público de tracking usado pela página de detalhe do place.
 */

const HAS_TEST_DB = process.env.DATABASE_URL?.includes('test');
const itWithDb = HAS_TEST_DB ? it : it.skip;

function tokenFor(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '1h' });
}

async function createUser(label: string) {
  const { prisma } = await import('../../src/db/prisma');
  const suffix = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return prisma.user.create({
    data: { email: `${suffix}@example.com`, googleId: `google-${suffix}` },
  });
}

async function createUnclaimedPlace(namePrefix: string) {
  const { prisma } = await import('../../src/db/prisma');
  const suffix = `${namePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const category = await prisma.category.upsert({
    where: { slug: 'business-test-category' },
    update: {},
    create: { slug: 'business-test-category', label: 'Categoria de Teste' },
  });

  return prisma.place.create({
    data: {
      name: `${namePrefix} ${suffix}`,
      address: 'Rua de Teste, 123',
      city: 'Rio de Janeiro',
      lat: -22.9068,
      lng: -43.1729,
      categoryId: category.id,
    },
  });
}

describe('painel do lojista (/business)', () => {
  describe('GET /api/v1/business/places/search', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).get('/api/v1/business/places/search').query({ q: 'pizza' });
      expect(res.status).toBe(401);
    });

    itWithDb('retorna 422 com q muito curto', async () => {
      const user = await createUser('search-owner');
      const res = await request(app)
        .get('/api/v1/business/places/search')
        .query({ q: 'a' })
        .set('Authorization', `Bearer ${tokenFor(user.id)}`);
      expect(res.status).toBe(422);
    });

    itWithDb('encontra um place não reivindicado com isClaimed/isMine falsos', async () => {
      const user = await createUser('search-owner');
      const place = await createUnclaimedPlace('Pizzaria Bela Napoli');

      const res = await request(app)
        .get('/api/v1/business/places/search')
        .query({ q: 'Bela Napoli' })
        .set('Authorization', `Bearer ${tokenFor(user.id)}`);

      expect(res.status).toBe(200);
      const found = res.body.data.find((p: { id: string }) => p.id === place.id);
      expect(found).toBeDefined();
      expect(found.isClaimed).toBe(false);
      expect(found.isMine).toBe(false);
    });
  });

  describe('POST /api/v1/business/claim', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).post('/api/v1/business/claim').send({ placeId: 'x' });
      expect(res.status).toBe(401);
    });

    itWithDb('retorna 422 sem placeId', async () => {
      const user = await createUser('claim-owner');
      const res = await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({});
      expect(res.status).toBe(422);
    });

    itWithDb('retorna 404 para placeId inexistente', async () => {
      const user = await createUser('claim-owner');
      const res = await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ placeId: 'place-que-nao-existe' });
      expect(res.status).toBe(404);
    });

    itWithDb('reivindica um place não reivindicado', async () => {
      const user = await createUser('claim-owner');
      const place = await createUnclaimedPlace('Barbearia Vintage');

      const res = await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ placeId: place.id });

      expect(res.status).toBe(200);
      expect(res.body.claimed).toBe(true);
    });

    itWithDb('retorna 409 ao tentar reivindicar um place já reivindicado por outra conta', async () => {
      const owner = await createUser('claim-first');
      const rival = await createUser('claim-second');
      const place = await createUnclaimedPlace('Academia Fit');

      await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(owner.id)}`)
        .send({ placeId: place.id });

      const res = await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(rival.id)}`)
        .send({ placeId: place.id });

      expect(res.status).toBe(409);
    });

    itWithDb('reivindicar o mesmo place duas vezes pelo mesmo dono é idempotente', async () => {
      const user = await createUser('claim-idempotent');
      const place = await createUnclaimedPlace('Café Central');

      const first = await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ placeId: place.id });
      const second = await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ placeId: place.id });

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
    });
  });

  describe('GET /api/v1/business/me', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).get('/api/v1/business/me');
      expect(res.status).toBe(401);
    });

    itWithDb('lista os places do lojista com assinatura "none" por padrão', async () => {
      const user = await createUser('me-owner');
      const place = await createUnclaimedPlace('Restaurante Sabor');

      await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ placeId: place.id });

      const res = await request(app)
        .get('/api/v1/business/me')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`);

      expect(res.status).toBe(200);
      expect(res.body.places.map((p: { id: string }) => p.id)).toContain(place.id);
      expect(res.body.subscription.status).toBe('none');
      // ownerId não deve vazar na resposta pública do painel
      expect(res.body.places[0].ownerId).toBeUndefined();
    });

    itWithDb('não retorna estabelecimentos de outros lojistas', async () => {
      const owner = await createUser('me-owner-2');
      const other = await createUser('me-other');
      const place = await createUnclaimedPlace('Loja Exclusiva');

      await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(owner.id)}`)
        .send({ placeId: place.id });

      const res = await request(app)
        .get('/api/v1/business/me')
        .set('Authorization', `Bearer ${tokenFor(other.id)}`);

      expect(res.status).toBe(200);
      expect(res.body.places.map((p: { id: string }) => p.id)).not.toContain(place.id);
    });
  });

  describe('PATCH /api/v1/business/places/:placeId', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).patch('/api/v1/business/places/x').send({});
      expect(res.status).toBe(401);
    });

    itWithDb('retorna 404 para placeId inexistente', async () => {
      const user = await createUser('patch-owner');
      const res = await request(app)
        .patch('/api/v1/business/places/place-que-nao-existe')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ description: 'novo texto' });
      expect(res.status).toBe(404);
    });

    itWithDb('retorna 403 quando quem edita não é o dono', async () => {
      const owner = await createUser('patch-owner-2');
      const stranger = await createUser('patch-stranger');
      const place = await createUnclaimedPlace('Sorveteria Gelato');

      await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(owner.id)}`)
        .send({ placeId: place.id });

      const res = await request(app)
        .patch(`/api/v1/business/places/${place.id}`)
        .set('Authorization', `Bearer ${tokenFor(stranger.id)}`)
        .send({ description: 'tentativa indevida' });

      expect(res.status).toBe(403);
    });

    itWithDb('atualiza descrição, whatsapp e link do cardápio', async () => {
      const user = await createUser('patch-success');
      const place = await createUnclaimedPlace('Padaria Trigo Dourado');

      await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ placeId: place.id });

      const res = await request(app)
        .patch(`/api/v1/business/places/${place.id}`)
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({
          description: 'Pão fresquinho todo dia',
          whatsappNumber: '5521999998888',
          menuUrl: 'https://cardapio.exemplo.com/trigo-dourado',
        });

      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Pão fresquinho todo dia');
      expect(res.body.whatsappNumber).toBe('5521999998888');
      expect(res.body.menuUrl).toBe('https://cardapio.exemplo.com/trigo-dourado');
    });
  });

  describe('GET /api/v1/business/places/:placeId/stats', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).get('/api/v1/business/places/x/stats');
      expect(res.status).toBe(401);
    });

    itWithDb('retorna 403 quando quem consulta não é o dono', async () => {
      const owner = await createUser('stats-owner');
      const stranger = await createUser('stats-stranger');
      const place = await createUnclaimedPlace('Farmácia Popular');

      await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(owner.id)}`)
        .send({ placeId: place.id });

      const res = await request(app)
        .get(`/api/v1/business/places/${place.id}/stats`)
        .set('Authorization', `Bearer ${tokenFor(stranger.id)}`);

      expect(res.status).toBe(403);
    });

    itWithDb('agrega visualizações e cliques por tipo de evento', async () => {
      const user = await createUser('stats-success');
      const place = await createUnclaimedPlace('Pet Shop Amigo Fiel');

      await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ placeId: place.id });

      // Dispara eventos via endpoint público de tracking, como a página de
      // detalhe do place faz de verdade.
      await request(app).post(`/api/v1/places/${place.id}/track`).send({ type: 'view' });
      await request(app).post(`/api/v1/places/${place.id}/track`).send({ type: 'view' });
      await request(app).post(`/api/v1/places/${place.id}/track`).send({ type: 'whatsapp_click' });
      await request(app).post(`/api/v1/places/${place.id}/track`).send({ type: 'route_click' });
      await request(app).post(`/api/v1/places/${place.id}/track`).send({ type: 'route_click' });

      const res = await request(app)
        .get(`/api/v1/business/places/${place.id}/stats`)
        .set('Authorization', `Bearer ${tokenFor(user.id)}`);

      expect(res.status).toBe(200);
      expect(res.body.viewsTotal).toBe(2);
      expect(res.body.clicksTotal).toBe(3);
      expect(res.body.clicksByType.whatsapp_click).toBe(1);
      expect(res.body.clicksByType.route_click).toBe(2);
      expect(res.body.clicksByType.phone_click).toBe(0);
      expect(res.body.clicksByType.menu_click).toBe(0);
    });
  });
});

describe('POST /api/v1/places/:id/track', () => {
  itWithDb('retorna 422 para um tipo de evento inválido (ex: "click" legado)', async () => {
    const place = await createUnclaimedPlace('Loja Qualquer');
    const res = await request(app)
      .post(`/api/v1/places/${place.id}/track`)
      .send({ type: 'click' });
    expect(res.status).toBe(422);
  });

  itWithDb('retorna 204 e não falha para um placeId inexistente (não vaza existência)', async () => {
    const res = await request(app)
      .post('/api/v1/places/place-que-nao-existe/track')
      .send({ type: 'view' });
    expect(res.status).toBe(204);
  });

  itWithDb('retorna 204 para um evento válido', async () => {
    const place = await createUnclaimedPlace('Loja Track');
    const res = await request(app)
      .post(`/api/v1/places/${place.id}/track`)
      .send({ type: 'phone_click' });
    expect(res.status).toBe(204);
  });
});
