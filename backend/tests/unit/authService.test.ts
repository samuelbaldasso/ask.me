import { env } from '../../src/config/env';

const verifyIdTokenMock = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: verifyIdTokenMock,
  })),
}));

jest.mock('../../src/db/prisma', () => ({
  prisma: {
    user: { upsert: jest.fn() },
  },
}));

import { prisma } from '../../src/db/prisma';
import { loginWithGoogle, AuthServiceError } from '../../src/services/authService';

describe('loginWithGoogle', () => {
  const originalClientId = env.GOOGLE_CLIENT_ID;

  beforeEach(() => {
    jest.clearAllMocks();
    (env as { GOOGLE_CLIENT_ID?: string }).GOOGLE_CLIENT_ID = 'test-google-client-id';
  });

  afterAll(() => {
    (env as { GOOGLE_CLIENT_ID?: string }).GOOGLE_CLIENT_ID = originalClientId;
  });

  it('lança 503 quando GOOGLE_CLIENT_ID não está configurado', async () => {
    (env as { GOOGLE_CLIENT_ID?: string }).GOOGLE_CLIENT_ID = undefined;

    await expect(loginWithGoogle('any-token')).rejects.toMatchObject({
      statusCode: 503,
    } satisfies Partial<AuthServiceError>);
  });

  it('lança 401 quando o token do Google é inválido', async () => {
    verifyIdTokenMock.mockRejectedValue(new Error('invalid token'));

    await expect(loginWithGoogle('bad-token')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('lança 401 quando o payload não tem email', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({ sub: 'google-123' }),
    });

    await expect(loginWithGoogle('token')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('cria/atualiza o usuário e retorna um JWT no caminho feliz', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-123',
        email: 'user@example.com',
        name: 'Usuária Teste',
        picture: 'https://example.com/avatar.png',
      }),
    });

    (prisma.user.upsert as jest.Mock).mockResolvedValue({
      id: 'user-cuid-1',
      email: 'user@example.com',
      name: 'Usuária Teste',
      avatarUrl: 'https://example.com/avatar.png',
    });

    const result = await loginWithGoogle('good-token');

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { googleId: 'google-123' } }),
    );
    expect(result.user.email).toBe('user@example.com');
    expect(typeof result.token).toBe('string');
    expect(result.token.split('.')).toHaveLength(3); // formato JWT
  });
});
