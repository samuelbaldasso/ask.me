// Reaplica infra/postgis_location.sql via Prisma. Necessário porque
// `prisma db push` remove a coluna `location` (não modelada no
// schema.prisma de propósito — ver comentário no topo do schema) toda vez
// que o schema é sincronizado. Faz parte do preDeployCommand do Railway
// (ver railway.json) — roda depois de todo `db push` em produção.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from './prisma';

/**
 * Divide o arquivo SQL em statements por `;`, mas ignora `;` dentro de
 * blocos `$$ ... $$` (corpo de função/trigger em plpgsql) — um split ingênuo
 * por regex quebra a função `sync_place_location` no meio. Linhas de
 * comentário (`-- ...`) são removidas antes do split — se deixadas coladas
 * no início de um statement, um filtro `startsWith('--')` descartaria o
 * bloco inteiro (comentário + SQL real) em vez de só o comentário.
 */
function splitStatements(sql: string): string[] {
  const withoutComments = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  const statements: string[] = [];
  let current = '';
  let inDollarBlock = false;

  for (let i = 0; i < withoutComments.length; i++) {
    if (withoutComments.startsWith('$$', i)) {
      inDollarBlock = !inDollarBlock;
      current += '$$';
      i++;
      continue;
    }

    const char = withoutComments[i];
    if (char === ';' && !inDollarBlock) {
      statements.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) statements.push(current);

  return statements.map((s) => s.trim()).filter((s) => s.length > 0);
}

async function main() {
  const sql = readFileSync(join(__dirname, '../../infra/postgis_location.sql'), 'utf-8');
  const statements = splitStatements(sql);

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
