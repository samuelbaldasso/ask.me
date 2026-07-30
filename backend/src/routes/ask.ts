import { Router, IRouter } from 'express';
import { askController } from '../controllers/askController';
import { authenticate, requireActiveSubscription } from '../middleware/auth';

const router: IRouter = Router();

/**
 * POST /ask
 * Requer autenticação + assinatura ativa — busca por IA é benefício
 * exclusivo do plano Premium (busca tradicional em /places continua livre).
 *
 * Body:
 *   query (obrigatório) — pergunta em linguagem natural
 *   lat   (obrigatório) — latitude do ponto central
 *   lng   (obrigatório) — longitude do ponto central
 */
router.post('/', authenticate, requireActiveSubscription, askController);

export default router;
