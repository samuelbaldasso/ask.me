import { Router, IRouter } from 'express';
import { askController } from '../controllers/askController';
import { authenticate } from '../middleware/auth';

const router: IRouter = Router();

/**
 * POST /ask
 * Requer autenticação (não requer mais assinatura — busca por IA é livre
 * para todo usuário logado; monetização passou a ser B2B, ver /business).
 *
 * Body:
 *   query (obrigatório) — pergunta em linguagem natural
 *   lat   (obrigatório) — latitude do ponto central
 *   lng   (obrigatório) — longitude do ponto central
 */
router.post('/', authenticate, askController);

export default router;
