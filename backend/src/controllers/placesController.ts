import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { searchPlacesService, searchQuerySchema, getPlaceByIdService } from '../services/placeService';
import { trackPlaceEvent, trackEventBodySchema } from '../services/businessService';

export async function getPlaceByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const place = await getPlaceByIdService(req.params.id);

    if (!place) {
      res.status(StatusCodes.NOT_FOUND).json({ error: 'Estabelecimento não encontrado' });
      return;
    }

    res.status(StatusCodes.OK).json(place);
  } catch (err) {
    next(err);
  }
}

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

export async function trackPlaceEventController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = trackEventBodySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        error: 'Parâmetros inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    await trackPlaceEvent(req.params.id, parsed.data.type);
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}
