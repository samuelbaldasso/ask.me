import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { nlSearchService, nlSearchQuerySchema } from '../services/nlSearchService';

export async function askController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = nlSearchQuerySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        error: 'Parâmetros inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await nlSearchService(parsed.data);

    res.status(StatusCodes.OK).json(result);
  } catch (err) {
    next(err);
  }
}
