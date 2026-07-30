import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env';
import { prisma } from '../db/prisma';

export interface AuthPayload {
  sub: string;   // user id
  iat: number;
  exp: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Middleware de autenticação JWT — opcional na Fase 1.
 *
 * Uso: adicionar `authenticate` a rotas que precisam de auth.
 * Rotas públicas (busca) não usam este middleware no MVP.
 *
 * Estrutura já preparada para quando o app exigir login.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Token não fornecido' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Token inválido ou expirado' });
  }
}

/**
 * Restringe a rota a usuários com assinatura ativa — usar sempre depois de
 * `authenticate` (depende de `req.user`). Regra de negócio: todas as
 * funcionalidades do lado consumidor (busca, IA, favoritos) são livres; a
 * assinatura paga agora é o plano B2B do lojista (ver routes/business.ts),
 * usado para liberar destaque/visibilidade nos resultados de busca.
 */
export async function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId: req.user!.sub },
    select: { status: true },
  });

  if (subscription?.status !== 'active') {
    res.status(StatusCodes.PAYMENT_REQUIRED).json({
      error: 'Esta funcionalidade é exclusiva do plano Premium.',
      code: 'SUBSCRIPTION_REQUIRED',
    });
    return;
  }

  next();
}
