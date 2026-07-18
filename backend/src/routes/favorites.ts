import { Router, IRouter } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listFavoritesController,
  addFavoriteController,
  removeFavoriteController,
} from '../controllers/favoritesController';

const router: IRouter = Router();

/**
 * GET /favorites?lat=&lng=
 * Requer autenticação. Lista os places favoritados pelo usuário, com
 * distância calculada a partir do ponto informado (localização atual).
 */
router.get('/', authenticate, listFavoritesController);

/**
 * POST /favorites { placeId }
 * Requer autenticação. Favorita um place (idempotente).
 */
router.post('/', authenticate, addFavoriteController);

/**
 * DELETE /favorites/:placeId
 * Requer autenticação. Remove um place dos favoritos (idempotente).
 */
router.delete('/:placeId', authenticate, removeFavoriteController);

export default router;
