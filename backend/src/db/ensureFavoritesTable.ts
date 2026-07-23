import { prisma } from './prisma';

/**
 * Cria a tabela `favorites` se ainda não existir.
 *
 * O projeto não usa `prisma migrate` (não há histórico de migrations
 * versionadas — o schema foi sincronizado manualmente/via `db push`), e
 * `prisma db push` tentaria derrubar a coluna `location` (gerenciada fora
 * do Prisma via PostGIS). Por isso essa tabela nova é criada de forma
 * idempotente no boot, em vez de via push/migrate.
 */
export async function ensureFavoritesTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS favorites (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      place_id text NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      created_at timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT favorites_user_id_place_id_key UNIQUE (user_id, place_id)
    );
  `);
}
