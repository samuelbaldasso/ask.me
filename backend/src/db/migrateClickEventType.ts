// Migração de dado único: o enum PlaceEventType tinha um valor genérico
// `click` (telefone e site indistintos) antes de virar tipos específicos
// (phone_click, whatsapp_click, website_click, route_click, menu_click —
// ver schema.prisma). `prisma db push` falha ao remover um valor de enum
// ainda referenciado por linhas existentes, então este script precisa
// rodar ANTES do push, remapeando os eventos antigos. Mapeia para
// `website_click` por ser o clique genérico mais próximo do comportamento
// antigo — não afeta o total de cliques do relatório, só a quebra por tipo.
import { prisma } from './prisma';

async function main() {
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
