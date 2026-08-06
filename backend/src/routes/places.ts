import { Router, IRouter } from 'express';
import {
  searchPlacesController,
  trackPlaceEventController,
  getPlaceByIdController,
} from '../controllers/placesController';

const router: IRouter = Router();

/**
 * GET /places
 *
 * Parâmetros de query:
 *   lat         (obrigatório) — latitude do ponto central
 *   lng         (obrigatório) — longitude do ponto central
 *   radius      (opcional)   — raio em metros (default: 5000, max: 50000)
 *   category    (opcional)   — slug da categoria (ex: "restaurante")
 *   openNow     (opcional)   — "true" para filtrar abertos agora
 *   acceptsPets (opcional)   — "true" para filtrar que aceitam pets
 *   limit       (opcional)   — itens por página (default: 20, max: 100)
 *   offset      (opcional)   — deslocamento para paginação (default: 0)
 */
router.get('/', searchPlacesController);

/**
 * GET /places/:id
 * Detalhe público de um estabelecimento, sem exigir localização do
 * visitante. Usado pela página de detalhe do site (SSR/metadata/SEO).
 */
router.get('/:id', getPlaceByIdController);

/**
 * POST /places/:id/track
 * Registra uma visualização ou clique (telefone/site) — usado no relatório
 * do painel do lojista. Pública (sem auth) pois o consumidor não faz login
 * para buscar/ver detalhes.
 *
 * Body: { type: "view" | "click" }
 */
router.post('/:id/track', trackPlaceEventController);

export default router;
