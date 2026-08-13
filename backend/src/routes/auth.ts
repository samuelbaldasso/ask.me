import { Router, IRouter } from 'express';
import { googleLoginController, getMeController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router: IRouter = Router();

/**
 * POST /auth/google
 *
 * Body: { idToken: string } — ID token obtido pelo app via Google Sign-In.
 * Verifica o token junto ao Google, cria/atualiza o usuário e retorna um
 * JWT próprio da aplicação (usado nas rotas autenticadas, ex: assinatura).
 */
router.post('/google', googleLoginController);

/**
 * GET /auth/me
 *
 * Retorna os dados do usuário logado (id, email, nome, avatar, isAdmin) a
 * partir do JWT enviado no header Authorization. Usado para reidratar a
 * sessão quando o app reabre com um token salvo (ver AuthViewModel.restoreSession).
 */
router.get('/me', authenticate, getMeController);

export default router;
