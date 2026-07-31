// Migração de dado único: o enum PlaceEventType tinha um valor genérico
// `click` (telefone e site indistintos) antes de virar tipos específicos
// (phone_click, whatsapp_click, website_click, route_click, menu_click —
// ver schema.prisma). `prisma db push` falha ao remover um valor de enum
// ainda referenciado por linhas existentes, então este script precisa
// rodar ANTES do push, remapeando os eventos antigos.
//
// Fica permanentemente no preDeployCommand do Railway (ver railway.json)
// como no-op depois que a migração já rodou uma vez — por isso PRECISA
// checar se `click` ainda existe no enum antes de referenciá-lo. Depois do
// primeiro `prisma db push` bem-sucedido, `click` é removido do tipo, e
// comparar `type = 'click'` contra um enum que não tem mais esse valor
// falha com "invalid input value for enum" (foi exatamente o que quebrou o
// deploy em produção — a checagem abaixo existe por causa disso).
import { prisma } from './prisma';

async function legacyClickValueExists(): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM pg_enum e
       JOIN pg_type t ON t.oid = e.enumtypid
       WHERE t.typname = 'PlaceEventType' AND e.enumlabel = 'click'
     ) AS exists`,
  );
  return rows[0]?.exists ?? false;
}

async function main() {
  if (!(await legacyClickValueExists())) {
    console.log("↷ Enum PlaceEventType já não tem o valor legado 'click' — nada a migrar.");
    return;
  }

  await prisma.$executeRawUnsafe(
    `ALTER TYPE "PlaceEventType" ADD VALUE IF NOT EXISTS 'website_click'`,
  );

  const result = await prisma.$executeRawUnsafe(
    `UPDATE place_events SET type = 'website_click' WHERE type = 'click'`,
  );
  console.log(`✅ ${result} evento(s) legado(s) 'click' migrados para 'website_click'.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
