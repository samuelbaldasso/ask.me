import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { geocodeService, geocodeQuerySchema } from '../services/geocodeService';

export async function geocodeController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = geocodeQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        error: 'Parâmetros inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await geocodeService(parsed.data);

    if (!result) {
      res.status(StatusCodes.NOT_FOUND).json({ error: 'Endereço não encontrado' });
      return;
    }

    res.status(StatusCodes.OK).json(result);
  } catch (err) {
    next(err);
  }
}
