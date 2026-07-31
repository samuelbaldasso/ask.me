import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import { prisma } from '../db/prisma';

let googleClient: OAuth2Client | null = null;

// Instanciado sob demanda (não no import) para respeitar GOOGLE_CLIENT_ID
// configurado em runtime, igual ao cliente Stripe em subscriptionService.
function getGoogleClient(): OAuth2Client | null {
  if (!env.GOOGLE_CLIENT_ID) {
    return null;
  }

  if (!googleClient) {
    googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }

  return googleClient;
}

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, 'idToken é obrigatório'),
});

export interface AuthResult {
  token: string;
  isNewUser: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    isAdmin: boolean;
  };
}

class AuthServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Verifica o ID token do Google Sign-In e retorna o payload (email, nome, sub).
 * Lança erro se o token for inválido/expirado ou GOOGLE_CLIENT_ID não estiver configurado.
 */
async function verifyGoogleIdToken(idToken: string) {
  const client = getGoogleClient();

  if (!client || !env.GOOGLE_CLIENT_ID) {
    throw new AuthServiceError('Login com Google não está configurado no servidor', 503);
  }

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
  } catch {
    throw new AuthServiceError('Token do Google inválido ou expirado', 401);
  }

  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email) {
    throw new AuthServiceError('Token do Google não contém os dados esperados', 401);
  }

  return payload;
}

function issueJwt(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Autentica (ou cria) um usuário a partir de um ID token do Google Sign-In
 * e retorna um JWT próprio da aplicação — o app mobile nunca lida com
 * tokens do Google além do login inicial.
 */
export async function loginWithGoogle(idToken: string): Promise<AuthResult> {
  const payload = await verifyGoogleIdToken(idToken);

  const user = await prisma.user.upsert({
    where: { googleId: payload.sub },
    update: {
      email: payload.email!,
      name: payload.name ?? undefined,
      avatarUrl: payload.picture ?? undefined,
    },
    create: {
      googleId: payload.sub,
      email: payload.email!,
      name: payload.name,
      avatarUrl: payload.picture,
    },
  });

  return {
    token: issueJwt(user.id),
    // Upsert não diz se criou ou atualizou; created_at === updated_at só é
    // verdade no instante da criação, então serve como sinal de "é o
    // primeiro login" pra disparar a conversão de inscrição só uma vez.
    isNewUser: user.createdAt.getTime() === user.updatedAt.getTime(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isAdmin: user.isAdmin,
    },
  };
}

export { AuthServiceError };
