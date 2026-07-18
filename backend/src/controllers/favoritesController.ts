import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  addFavoriteService,
  removeFavoriteService,
  listFavoritesService,
  favoritesQuerySchema,
  favoriteBodySchema,
} from '../services/favoriteService';

export async function listFavoritesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = favoritesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        error: 'Parâmetros inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await listFavoritesService(req.user!.sub, parsed.data.lat, parsed.data.lng);
    res.status(StatusCodes.OK).json(result);
  } catch (err) {
    next(err);
  }
}

export async function addFavoriteController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = favoriteBodySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        error: 'Parâmetros inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    await addFavoriteService(req.user!.sub, parsed.data.placeId);
    res.status(StatusCodes.CREATED).json({ favorited: true });
  } catch (err) {
    next(err);
  }
}

export async function removeFavoriteController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await removeFavoriteService(req.user!.sub, req.params.placeId);
    res.status(StatusCodes.OK).json({ favorited: false });
  } catch (err) {
    next(err);
  }
}
