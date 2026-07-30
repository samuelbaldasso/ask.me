// Script de emergência: reaplica infra/postgis_location.sql via Prisma.
// Necessário porque `prisma db push` removeu a coluna `location` (não
// modelada no schema.prisma de propósito) em 2026-07-30.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from './prisma';

async function main() {
  const sql = readFileSync(join(__dirname, '../../infra/postgis_location.sql'), 'utf-8');
  const statements = sql
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    console.log('▶', statement.split('\n')[0].slice(0, 80));
    await prisma.$executeRawUnsafe(statement);
  }

  console.log('✅ Coluna location, índice e trigger restaurados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
