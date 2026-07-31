import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import { env } from '../../src/config/env';

/**
 * Testes de integração — requerem banco PostgreSQL rodando (ver places.test.ts).
 * Cobre o painel do lojista (claim pendente, edição de perfil, relatório de
 * eventos), a fila de revisão do admin e o endpoint público de tracking
 * usado pela página de detalhe do place.
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

async function createAdminUser(label: string) {
  const { prisma } = await import('../../src/db/prisma');
  const suffix = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return prisma.user.create({
    data: { email: `${suffix}@example.com`, googleId: `google-${suffix}`, isAdmin: true },
  });
}

/**
 * Cria o pedido de reivindicação via endpoint público e força a aprovação
 * direto no banco (bypass do fluxo /admin/claims) — usado pelos testes que
 * só precisam de um place já aprovado como pré-condição, sem re-testar o
 * fluxo de aprovação em si (ver describe('painel admin') pra isso).
 */
async function claimAndApprove(userId: string, placeId: string) {
  const { prisma } = await import('../../src/db/prisma');
  await request(app)
    .post('/api/v1/business/claim')
    .set('Authorization', `Bearer ${tokenFor(userId)}`)
    .send({ placeId });

  await prisma.$transaction([
    prisma.place.update({ where: { id: placeId }, data: { ownerId: userId } }),
    prisma.businessClaim.updateMany({
      where: { placeId, userId },
      data: { status: 'approved', reviewedAt: new Date() },
    }),
  ]);
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

    itWithDb('encontra um place não reivindicado com isClaimed/isMine/myClaimStatus corretos', async () => {
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
      expect(found.myClaimStatus).toBeNull();
    });

    itWithDb('sinaliza myClaimStatus "pending" depois de reivindicar', async () => {
      const user = await createUser('search-pending');
      const place = await createUnclaimedPlace('Hamburgueria Status Pendente');

      await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ placeId: place.id });

      const res = await request(app)
        .get('/api/v1/business/places/search')
        .query({ q: 'Status Pendente' })
        .set('Authorization', `Bearer ${tokenFor(user.id)}`);

      const found = res.body.data.find((p: { id: string }) => p.id === place.id);
      expect(found.isClaimed).toBe(false);
      expect(found.isMine).toBe(false);
      expect(found.myClaimStatus).toBe('pending');
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

    itWithDb('cria um pedido pendente para um place não reivindicado', async () => {
      const user = await createUser('claim-owner');
      const place = await createUnclaimedPlace('Barbearia Vintage');

      const res = await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ placeId: place.id });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('pending');

      // Não vincula o place automaticamente — só depois da aprovação do admin
      const check = await request(app)
        .get('/api/v1/business/me')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`);
      expect(check.body.places.map((p: { id: string }) => p.id)).not.toContain(place.id);
    });

    itWithDb('dois usuários diferentes podem reivindicar o mesmo place não aprovado', async () => {
      const first = await createUser('claim-multi-1');
      const second = await createUser('claim-multi-2');
      const place = await createUnclaimedPlace('Academia Fit');

      const firstRes = await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(first.id)}`)
        .send({ placeId: place.id });
      const secondRes = await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(second.id)}`)
        .send({ placeId: place.id });

      // Ambos ficam pendentes — cabe ao admin decidir quem é o dono de fato.
      expect(firstRes.status).toBe(200);
      expect(firstRes.body.status).toBe('pending');
      expect(secondRes.status).toBe(200);
      expect(secondRes.body.status).toBe('pending');
    });

    itWithDb('retorna 409 ao tentar reivindicar um place já aprovado para outra conta', async () => {
      const owner = await createUser('claim-approved-owner');
      const rival = await createUser('claim-approved-rival');
      const place = await createUnclaimedPlace('Café Central');

      await claimAndApprove(owner.id, place.id);

      const res = await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(rival.id)}`)
        .send({ placeId: place.id });

      expect(res.status).toBe(409);
    });

    itWithDb('reivindicar o próprio place já aprovado é idempotente', async () => {
      const user = await createUser('claim-approved-idempotent');
      const place = await createUnclaimedPlace('Restaurante Já Aprovado');

      await claimAndApprove(user.id, place.id);

      const res = await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ placeId: place.id });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('approved');
    });

    itWithDb('reivindicar de novo depois de pendente continua pendente (idempotente)', async () => {
      const user = await createUser('claim-pending-idempotent');
      const place = await createUnclaimedPlace('Loja Pendente Repetida');

      const first = await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ placeId: place.id });
      const second = await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ placeId: place.id });

      expect(first.status).toBe(200);
      expect(first.body.status).toBe('pending');
      expect(second.status).toBe(200);
      expect(second.body.status).toBe('pending');
    });
  });

  describe('GET /api/v1/business/me', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).get('/api/v1/business/me');
      expect(res.status).toBe(401);
    });

    itWithDb('lista os places aprovados do lojista com assinatura "none" por padrão', async () => {
      const user = await createUser('me-owner');
      const place = await createUnclaimedPlace('Restaurante Sabor');

      await claimAndApprove(user.id, place.id);

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

      await claimAndApprove(owner.id, place.id);

      const res = await request(app)
        .get('/api/v1/business/me')
        .set('Authorization', `Bearer ${tokenFor(other.id)}`);

      expect(res.status).toBe(200);
      expect(res.body.places.map((p: { id: string }) => p.id)).not.toContain(place.id);
    });

    itWithDb('lista reivindicações pendentes separadamente dos places aprovados', async () => {
      const user = await createUser('me-pending');
      const place = await createUnclaimedPlace('Loja Aguardando Aprovação');

      await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ placeId: place.id });

      const res = await request(app)
        .get('/api/v1/business/me')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`);

      expect(res.status).toBe(200);
      expect(res.body.places).toEqual([]);
      expect(res.body.pendingClaims).toHaveLength(1);
      expect(res.body.pendingClaims[0].status).toBe('pending');
      expect(res.body.pendingClaims[0].place.id).toBe(place.id);
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

    itWithDb('retorna 403 para quem só tem reivindicação pendente (ainda não aprovada)', async () => {
      const user = await createUser('patch-pending');
      const place = await createUnclaimedPlace('Loja Edição Antes de Aprovar');

      await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ placeId: place.id });

      const res = await request(app)
        .patch(`/api/v1/business/places/${place.id}`)
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ description: 'tentativa antes da aprovação' });

      expect(res.status).toBe(403);
    });

    itWithDb('retorna 403 quando quem edita não é o dono', async () => {
      const owner = await createUser('patch-owner-2');
      const stranger = await createUser('patch-stranger');
      const place = await createUnclaimedPlace('Sorveteria Gelato');

      await claimAndApprove(owner.id, place.id);

      const res = await request(app)
        .patch(`/api/v1/business/places/${place.id}`)
        .set('Authorization', `Bearer ${tokenFor(stranger.id)}`)
        .send({ description: 'tentativa indevida' });

      expect(res.status).toBe(403);
    });

    itWithDb('atualiza descrição, whatsapp, cardápio e fotos', async () => {
      const user = await createUser('patch-success');
      const place = await createUnclaimedPlace('Padaria Trigo Dourado');

      await claimAndApprove(user.id, place.id);

      const res = await request(app)
        .patch(`/api/v1/business/places/${place.id}`)
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({
          description: 'Pão fresquinho todo dia',
          whatsappNumber: '5521999998888',
          menuUrl: 'https://cardapio.exemplo.com/trigo-dourado',
          photoUrls: ['https://exemplo.com/foto1.jpg', 'https://exemplo.com/foto2.jpg'],
        });

      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Pão fresquinho todo dia');
      expect(res.body.whatsappNumber).toBe('5521999998888');
      expect(res.body.menuUrl).toBe('https://cardapio.exemplo.com/trigo-dourado');
      expect(res.body.photoUrls).toEqual([
        'https://exemplo.com/foto1.jpg',
        'https://exemplo.com/foto2.jpg',
      ]);
    });

    itWithDb('retorna 422 com mais de 6 fotos', async () => {
      const user = await createUser('patch-too-many-photos');
      const place = await createUnclaimedPlace('Loja Fotos Demais');

      await claimAndApprove(user.id, place.id);

      const res = await request(app)
        .patch(`/api/v1/business/places/${place.id}`)
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ photoUrls: Array.from({ length: 7 }, (_, i) => `https://exemplo.com/${i}.jpg`) });

      expect(res.status).toBe(422);
    });
  });

  describe('horário de funcionamento (/business/places/:placeId/hours)', () => {
    it('GET retorna 401 sem token', async () => {
      const res = await request(app).get('/api/v1/business/places/x/hours');
      expect(res.status).toBe(401);
    });

    it('PUT retorna 401 sem token', async () => {
      const res = await request(app).put('/api/v1/business/places/x/hours').send({ hours: [] });
      expect(res.status).toBe(401);
    });

    itWithDb('retorna lista vazia para um place recém-aprovado sem horário cadastrado', async () => {
      const user = await createUser('hours-empty');
      const place = await createUnclaimedPlace('Loja Sem Horário');

      await claimAndApprove(user.id, place.id);

      const res = await request(app)
        .get(`/api/v1/business/places/${place.id}/hours`)
        .set('Authorization', `Bearer ${tokenFor(user.id)}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    itWithDb('retorna 403 ao editar horário de um place de outro dono', async () => {
      const owner = await createUser('hours-owner');
      const stranger = await createUser('hours-stranger');
      const place = await createUnclaimedPlace('Mercadinho Horário');

      await claimAndApprove(owner.id, place.id);

      const res = await request(app)
        .put(`/api/v1/business/places/${place.id}/hours`)
        .set('Authorization', `Bearer ${tokenFor(stranger.id)}`)
        .send({ hours: [{ dayOfWeek: 1, opensAt: '09:00', closesAt: '18:00', isClosed: false }] });

      expect(res.status).toBe(403);
    });

    itWithDb('retorna 422 para horário em formato inválido', async () => {
      const user = await createUser('hours-invalid');
      const place = await createUnclaimedPlace('Loja Horário Inválido');

      await claimAndApprove(user.id, place.id);

      const res = await request(app)
        .put(`/api/v1/business/places/${place.id}/hours`)
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ hours: [{ dayOfWeek: 1, opensAt: '9h', closesAt: '18:00', isClosed: false }] });

      expect(res.status).toBe(422);
    });

    itWithDb('grava e depois atualiza o horário de um dia (upsert)', async () => {
      const user = await createUser('hours-upsert');
      const place = await createUnclaimedPlace('Restaurante Horário Certo');

      await claimAndApprove(user.id, place.id);

      const first = await request(app)
        .put(`/api/v1/business/places/${place.id}/hours`)
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ hours: [{ dayOfWeek: 1, opensAt: '09:00', closesAt: '18:00', isClosed: false }] });

      expect(first.status).toBe(200);
      expect(first.body.data).toEqual([
        { dayOfWeek: 1, opensAt: '09:00', closesAt: '18:00', isClosed: false },
      ]);

      const second = await request(app)
        .put(`/api/v1/business/places/${place.id}/hours`)
        .set('Authorization', `Bearer ${tokenFor(user.id)}`)
        .send({ hours: [{ dayOfWeek: 1, opensAt: '10:00', closesAt: '22:00', isClosed: false }] });

      expect(second.status).toBe(200);
      expect(second.body.data).toEqual([
        { dayOfWeek: 1, opensAt: '10:00', closesAt: '22:00', isClosed: false },
      ]);
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

      await claimAndApprove(owner.id, place.id);

      const res = await request(app)
        .get(`/api/v1/business/places/${place.id}/stats`)
        .set('Authorization', `Bearer ${tokenFor(stranger.id)}`);

      expect(res.status).toBe(403);
    });

    itWithDb('agrega visualizações e cliques por tipo de evento', async () => {
      const user = await createUser('stats-success');
      const place = await createUnclaimedPlace('Pet Shop Amigo Fiel');

      await claimAndApprove(user.id, place.id);

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

describe('painel admin (/admin/claims)', () => {
  describe('GET /api/v1/admin/claims', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).get('/api/v1/admin/claims');
      expect(res.status).toBe(401);
    });

    itWithDb('retorna 403 para usuário autenticado sem isAdmin', async () => {
      const user = await createUser('admin-forbidden');
      const res = await request(app)
        .get('/api/v1/admin/claims')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`);
      expect(res.status).toBe(403);
    });

    itWithDb('lista reivindicações pendentes com dados do place e do usuário', async () => {
      const admin = await createAdminUser('admin-list');
      const claimant = await createUser('admin-list-claimant');
      const place = await createUnclaimedPlace('Loja Fila De Aprovação');

      await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(claimant.id)}`)
        .send({ placeId: place.id });

      const res = await request(app)
        .get('/api/v1/admin/claims')
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);

      expect(res.status).toBe(200);
      const found = res.body.data.find((c: { place: { id: string } }) => c.place.id === place.id);
      expect(found).toBeDefined();
      expect(found.user.id).toBe(claimant.id);
      expect(found.place.name).toBe(place.name);
    });
  });

  describe('POST /api/v1/admin/claims/:claimId/approve', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).post('/api/v1/admin/claims/x/approve');
      expect(res.status).toBe(401);
    });

    itWithDb('retorna 403 para usuário autenticado sem isAdmin', async () => {
      const user = await createUser('admin-approve-forbidden');
      const res = await request(app)
        .post('/api/v1/admin/claims/x/approve')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`);
      expect(res.status).toBe(403);
    });

    itWithDb('retorna 404 para claimId inexistente', async () => {
      const admin = await createAdminUser('admin-approve-404');
      const res = await request(app)
        .post('/api/v1/admin/claims/claim-que-nao-existe/approve')
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);
      expect(res.status).toBe(404);
    });

    itWithDb('aprova e vincula o place ao usuário', async () => {
      const admin = await createAdminUser('admin-approve-success');
      const claimant = await createUser('admin-approve-claimant');
      const place = await createUnclaimedPlace('Restaurante Aprovado Pelo Admin');

      const claimRes = await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(claimant.id)}`)
        .send({ placeId: place.id });

      const list = await request(app)
        .get('/api/v1/admin/claims')
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);
      const claim = list.body.data.find((c: { place: { id: string } }) => c.place.id === place.id);

      const approveRes = await request(app)
        .post(`/api/v1/admin/claims/${claim.id}/approve`)
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);

      expect(claimRes.body.status).toBe('pending');
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.approved).toBe(true);

      const me = await request(app)
        .get('/api/v1/business/me')
        .set('Authorization', `Bearer ${tokenFor(claimant.id)}`);
      expect(me.body.places.map((p: { id: string }) => p.id)).toContain(place.id);
    });

    itWithDb('aprovar um pedido rejeita automaticamente os demais pedidos do mesmo place', async () => {
      const admin = await createAdminUser('admin-approve-conflict');
      const winner = await createUser('admin-approve-winner');
      const loser = await createUser('admin-approve-loser');
      const place = await createUnclaimedPlace('Loja Disputada');

      await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(winner.id)}`)
        .send({ placeId: place.id });
      await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(loser.id)}`)
        .send({ placeId: place.id });

      const list = await request(app)
        .get('/api/v1/admin/claims')
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);
      const winnerClaim = list.body.data.find(
        (c: { place: { id: string }; user: { id: string } }) =>
          c.place.id === place.id && c.user.id === winner.id,
      );

      await request(app)
        .post(`/api/v1/admin/claims/${winnerClaim.id}/approve`)
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);

      const loserMe = await request(app)
        .get('/api/v1/business/me')
        .set('Authorization', `Bearer ${tokenFor(loser.id)}`);
      expect(loserMe.body.places).toEqual([]);
      expect(loserMe.body.pendingClaims[0].status).toBe('rejected');
    });

    itWithDb('retorna 409 ao aprovar um claim já revisado', async () => {
      const admin = await createAdminUser('admin-approve-twice');
      const claimant = await createUser('admin-approve-twice-claimant');
      const place = await createUnclaimedPlace('Loja Aprovada Duas Vezes');

      await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(claimant.id)}`)
        .send({ placeId: place.id });

      const list = await request(app)
        .get('/api/v1/admin/claims')
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);
      const claim = list.body.data.find((c: { place: { id: string } }) => c.place.id === place.id);

      await request(app)
        .post(`/api/v1/admin/claims/${claim.id}/approve`)
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);
      const secondApprove = await request(app)
        .post(`/api/v1/admin/claims/${claim.id}/approve`)
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);

      expect(secondApprove.status).toBe(409);
    });
  });

  describe('POST /api/v1/admin/claims/:claimId/reject', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).post('/api/v1/admin/claims/x/reject');
      expect(res.status).toBe(401);
    });

    itWithDb('rejeita um pedido pendente sem vincular o place', async () => {
      const admin = await createAdminUser('admin-reject-success');
      const claimant = await createUser('admin-reject-claimant');
      const place = await createUnclaimedPlace('Loja Rejeitada');

      await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(claimant.id)}`)
        .send({ placeId: place.id });

      const list = await request(app)
        .get('/api/v1/admin/claims')
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);
      const claim = list.body.data.find((c: { place: { id: string } }) => c.place.id === place.id);

      const rejectRes = await request(app)
        .post(`/api/v1/admin/claims/${claim.id}/reject`)
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.rejected).toBe(true);

      const me = await request(app)
        .get('/api/v1/business/me')
        .set('Authorization', `Bearer ${tokenFor(claimant.id)}`);
      expect(me.body.places).toEqual([]);
      expect(me.body.pendingClaims[0].status).toBe('rejected');
    });
  });

  describe('GET /api/v1/admin/claims/approved', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).get('/api/v1/admin/claims/approved');
      expect(res.status).toBe(401);
    });

    itWithDb('retorna 403 para usuário autenticado sem isAdmin', async () => {
      const user = await createUser('admin-approved-list-forbidden');
      const res = await request(app)
        .get('/api/v1/admin/claims/approved')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`);
      expect(res.status).toBe(403);
    });

    itWithDb('lista estabelecimentos com dono aprovado', async () => {
      const admin = await createAdminUser('admin-approved-list');
      const owner = await createUser('admin-approved-list-owner');
      const place = await createUnclaimedPlace('Loja Já Aprovada Para Listar');

      await claimAndApprove(owner.id, place.id);

      const res = await request(app)
        .get('/api/v1/admin/claims/approved')
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);

      expect(res.status).toBe(200);
      const found = res.body.data.find((c: { place: { id: string } }) => c.place.id === place.id);
      expect(found).toBeDefined();
      expect(found.user.id).toBe(owner.id);
    });
  });

  describe('POST /api/v1/admin/claims/:claimId/revoke', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).post('/api/v1/admin/claims/x/revoke');
      expect(res.status).toBe(401);
    });

    itWithDb('retorna 403 para usuário autenticado sem isAdmin', async () => {
      const user = await createUser('admin-revoke-forbidden');
      const res = await request(app)
        .post('/api/v1/admin/claims/x/revoke')
        .set('Authorization', `Bearer ${tokenFor(user.id)}`);
      expect(res.status).toBe(403);
    });

    itWithDb('retorna 404 para claimId inexistente', async () => {
      const admin = await createAdminUser('admin-revoke-404');
      const res = await request(app)
        .post('/api/v1/admin/claims/claim-que-nao-existe/revoke')
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);
      expect(res.status).toBe(404);
    });

    itWithDb('retorna 409 ao tentar revogar um claim que nunca foi aprovado', async () => {
      const admin = await createAdminUser('admin-revoke-not-approved');
      const claimant = await createUser('admin-revoke-not-approved-claimant');
      const place = await createUnclaimedPlace('Loja Nunca Aprovada');

      await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(claimant.id)}`)
        .send({ placeId: place.id });

      const list = await request(app)
        .get('/api/v1/admin/claims')
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);
      const claim = list.body.data.find((c: { place: { id: string } }) => c.place.id === place.id);

      const res = await request(app)
        .post(`/api/v1/admin/claims/${claim.id}/revoke`)
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);

      expect(res.status).toBe(409);
    });

    itWithDb('revoga a aprovação, desvincula o place e permite reivindicar de novo', async () => {
      const admin = await createAdminUser('admin-revoke-success');
      const owner = await createUser('admin-revoke-success-owner');
      const place = await createUnclaimedPlace('Restaurante Revogado');

      await claimAndApprove(owner.id, place.id);

      const approvedList = await request(app)
        .get('/api/v1/admin/claims/approved')
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);
      const claim = approvedList.body.data.find(
        (c: { place: { id: string } }) => c.place.id === place.id,
      );

      const revokeRes = await request(app)
        .post(`/api/v1/admin/claims/${claim.id}/revoke`)
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);

      expect(revokeRes.status).toBe(200);
      expect(revokeRes.body.revoked).toBe(true);

      const me = await request(app)
        .get('/api/v1/business/me')
        .set('Authorization', `Bearer ${tokenFor(owner.id)}`);
      expect(me.body.places).toEqual([]);
      expect(me.body.pendingClaims[0].status).toBe('revoked');

      // O place volta a ficar livre pra reivindicação
      const reclaimRes = await request(app)
        .post('/api/v1/business/claim')
        .set('Authorization', `Bearer ${tokenFor(owner.id)}`)
        .send({ placeId: place.id });
      expect(reclaimRes.status).toBe(200);
      expect(reclaimRes.body.status).toBe('pending');
    });

    itWithDb('retorna 409 ao revogar o mesmo claim duas vezes', async () => {
      const admin = await createAdminUser('admin-revoke-twice');
      const owner = await createUser('admin-revoke-twice-owner');
      const place = await createUnclaimedPlace('Loja Revogada Duas Vezes');

      await claimAndApprove(owner.id, place.id);

      const approvedList = await request(app)
        .get('/api/v1/admin/claims/approved')
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);
      const claim = approvedList.body.data.find(
        (c: { place: { id: string } }) => c.place.id === place.id,
      );

      await request(app)
        .post(`/api/v1/admin/claims/${claim.id}/revoke`)
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);
      const secondRevoke = await request(app)
        .post(`/api/v1/admin/claims/${claim.id}/revoke`)
        .set('Authorization', `Bearer ${tokenFor(admin.id)}`);

      expect(secondRevoke.status).toBe(409);
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
