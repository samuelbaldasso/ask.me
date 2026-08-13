import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { googleLoginSchema, loginWithGoogle, getCurrentUser } from '../services/authService';

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

export async function getMeController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await getCurrentUser(req.user!.sub);
    res.status(StatusCodes.OK).json({ user });
  } catch (err) {
    next(err);
  }
}
