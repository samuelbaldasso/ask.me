import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

// Singleton — reutiliza a mesma conexão em toda a aplicação.
// Em testes, cada suite cria sua própria instância via jest.setup.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
