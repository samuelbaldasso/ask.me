import { Router, IRouter } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  listPendingClaimsController,
  listApprovedClaimsController,
  approveClaimController,
  rejectClaimController,
  revokeClaimController,
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

// GET /admin/claims/approved — estabelecimentos com dono aprovado, pra opção de revogar
router.get('/claims/approved', authenticate, requireAdmin, listApprovedClaimsController);

// POST /admin/claims/:claimId/approve — vincula o place ao usuário e rejeita os demais pedidos pendentes do mesmo place
router.post('/claims/:claimId/approve', authenticate, requireAdmin, approveClaimController);

// POST /admin/claims/:claimId/reject
router.post('/claims/:claimId/reject', authenticate, requireAdmin, rejectClaimController);

// POST /admin/claims/:claimId/revoke — desfaz uma aprovação, desvincula o place do lojista
router.post('/claims/:claimId/revoke', authenticate, requireAdmin, revokeClaimController);

export default router;
