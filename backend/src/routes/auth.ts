import { Router, IRouter } from 'express';
import { googleLoginController } from '../controllers/authController';

const router: IRouter = Router();

/**
 * POST /auth/google
 *
 * Body: { idToken: string } — ID token obtido pelo app via Google Sign-In.
 * Verifica o token junto ao Google, cria/atualiza o usuário e retorna um
 * JWT próprio da aplicação (usado nas rotas autenticadas, ex: assinatura).
 */
router.post('/google', googleLoginController);

export default router;
