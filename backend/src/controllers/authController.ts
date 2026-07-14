import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { googleLoginSchema, loginWithGoogle } from '../services/authService';

export async function googleLoginController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = googleLoginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        error: 'Parâmetros inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await loginWithGoogle(parsed.data.idToken);

    res.status(StatusCodes.OK).json(result);
  } catch (err) {
    next(err);
  }
}
