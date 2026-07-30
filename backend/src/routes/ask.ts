import { Router, IRouter } from 'express';
import { askController } from '../controllers/askController';

const router: IRouter = Router();

/**
 * POST /ask
 * Pública — busca por IA é livre para todo mundo, sem login, igual à busca
 * tradicional em /places. Monetização passou a ser B2B (ver /business).
 *
 * Body:
 *   query (obrigatório) — pergunta em linguagem natural
 *   lat   (obrigatório) — latitude do ponto central
 *   lng   (obrigatório) — longitude do ponto central
 */
router.post('/', askController);

export default router;
