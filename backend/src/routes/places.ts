import { Router, IRouter } from 'express';
import { searchPlacesController } from '../controllers/placesController';

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

export default router;
