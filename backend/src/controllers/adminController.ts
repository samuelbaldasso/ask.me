import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { listPendingClaims, approveClaim, rejectClaim } from '../services/adminService';

export async function listPendingClaimsController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await listPendingClaims();
    res.status(StatusCodes.OK).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function approveClaimController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await approveClaim(req.params.claimId);
    res.status(StatusCodes.OK).json({ approved: true });
  } catch (err) {
    next(err);
  }
}

export async function rejectClaimController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await rejectClaim(req.params.claimId);
    res.status(StatusCodes.OK).json({ rejected: true });
  } catch (err) {
    next(err);
  }
}
