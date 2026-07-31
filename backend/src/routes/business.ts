import { Router, IRouter } from 'express';
import { authenticate } from '../middleware/auth';
import {
  searchClaimablePlacesController,
  claimPlaceController,
  getMyBusinessController,
  updatePlaceController,
  getPlaceStatsController,
  getOpeningHoursController,
  updateOpeningHoursController,
} from '../controllers/businessController';

const router: IRouter = Router();

/**
 * Painel do lojista (B2B) — todas as rotas exigem login. O plano pago
 * (Stripe, ver routes/subscriptions.ts) é reaproveitado para o lojista em
 * vez do consumidor final, que agora usa o app 100% de graça.
 */

// GET /business/places/search?q=nome — busca no catálogo já importado para o lojista achar o próprio negócio
router.get('/places/search', authenticate, searchClaimablePlacesController);

// POST /business/claim { placeId } — vincula o estabelecimento à conta logada
router.post('/claim', authenticate, claimPlaceController);

// GET /business/me — estabelecimentos do lojista + status da assinatura
router.get('/me', authenticate, getMyBusinessController);

// PATCH /business/places/:placeId — edita perfil (descrição, telefone, site, atributos)
router.patch('/places/:placeId', authenticate, updatePlaceController);

// GET /business/places/:placeId/stats — relatório de visualizações/cliques
router.get('/places/:placeId/stats', authenticate, getPlaceStatsController);

// GET /business/places/:placeId/hours — horário de funcionamento atual
router.get('/places/:placeId/hours', authenticate, getOpeningHoursController);

// PUT /business/places/:placeId/hours { hours: [...] } — substitui o horário de um ou mais dias
router.put('/places/:placeId/hours', authenticate, updateOpeningHoursController);

export default router;
