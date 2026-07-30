import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  searchClaimablePlaces,
  claimPlace,
  getMyBusiness,
  updatePlaceProfile,
  getPlaceStats,
  claimSearchQuerySchema,
  claimBodySchema,
  updatePlaceBodySchema,
} from '../services/businessService';

export async function searchClaimablePlacesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = claimSearchQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        error: 'Parâmetros inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const results = await searchClaimablePlaces(parsed.data.q, req.user!.sub);
    res.status(StatusCodes.OK).json({ data: results });
  } catch (err) {
    next(err);
  }
}

export async function claimPlaceController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = claimBodySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        error: 'Parâmetros inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    await claimPlace(req.user!.sub, parsed.data.placeId);
    res.status(StatusCodes.OK).json({ claimed: true });
  } catch (err) {
    next(err);
  }
}

export async function getMyBusinessController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await getMyBusiness(req.user!.sub);
    res.status(StatusCodes.OK).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updatePlaceController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = updatePlaceBodySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        error: 'Parâmetros inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await updatePlaceProfile(req.user!.sub, req.params.placeId, parsed.data);
    res.status(StatusCodes.OK).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getPlaceStatsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await getPlaceStats(req.user!.sub, req.params.placeId);
    res.status(StatusCodes.OK).json(result);
  } catch (err) {
    next(err);
  }
}
