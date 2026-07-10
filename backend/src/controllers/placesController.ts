import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { searchPlacesService, searchQuerySchema } from '../services/placeService';

export async function searchPlacesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = searchQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        error: 'Parâmetros inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await searchPlacesService(parsed.data);

    res.status(StatusCodes.OK).json(result);
  } catch (err) {
    next(err);
  }
}
