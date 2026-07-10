import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env';

interface ApiError extends Error {
  statusCode?: number;
}

/**
 * Middleware de tratamento de erros centralizado.
 * Captura qualquer erro propagado via next(err).
 *
 * Em produção, não expõe stack trace — apenas a mensagem genérica.
 */
export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const status = err.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;
  const message =
    env.NODE_ENV === 'production'
      ? 'Ocorreu um erro interno. Tente novamente mais tarde.'
      : err.message;

  if (status >= 500) {
    console.error('[Error]', err);
  }

  res.status(status).json({ error: message });
}
