import { Router, IRouter } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  listPendingClaimsController,
  approveClaimController,
  rejectClaimController,
} from '../controllers/adminController';

const router: IRouter = Router();

/**
 * Fila de revisão manual de reivindicações de estabelecimento — todas as
 * rotas exigem `isAdmin = true` (ver middleware/auth.ts requireAdmin).
 * Sem verificação forte automatizada (SMS/documento) no MVP, aprovar
 * manualmente evita que qualquer usuário assuma a gestão de um negócio
 * alheio.
 */

// GET /admin/claims — reivindicações pendentes, mais antigas primeiro
router.get('/claims', authenticate, requireAdmin, listPendingClaimsController);

// POST /admin/claims/:claimId/approve — vincula o place ao usuário e rejeita os demais pedidos pendentes do mesmo place
router.post('/claims/:claimId/approve', authenticate, requireAdmin, approveClaimController);

// POST /admin/claims/:claimId/reject
router.post('/claims/:claimId/reject', authenticate, requireAdmin, rejectClaimController);

export default router;
