import { Router, IRouter } from 'express';
import { askController } from '../controllers/askController';

const router: IRouter = Router();

/**
 * POST /ask
 *
 * Body:
 *   query (obrigatório) — pergunta em linguagem natural
 *   lat   (obrigatório) — latitude do ponto central
 *   lng   (obrigatório) — longitude do ponto central
 */
router.post('/', askController);

export default router;
