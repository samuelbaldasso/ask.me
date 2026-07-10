/**
 * Enriquece estabelecimentos existentes com dados da Google Places API
 * (telefone, website) quando ausentes no banco.
 *
 * Uso: npm run places:enrich
 *
 * Sem GOOGLE_PLACES_API_KEY configurada, encerra sem custo e sem alterar dados.
 * Só atualiza campos que estão nulos — nunca sobrescreve dado já cadastrado
 * manualmente (a API do Google é fonte de enriquecimento, não de verdade).
 */
import { prisma } from './prisma';
import { enrichPlaceFromGoogle } from '../services/mapsService';
import { env } from '../config/env';

async function main() {
  if (!env.GOOGLE_PLACES_API_KEY) {
    console.log('⚠️  GOOGLE_PLACES_API_KEY não configurada — nada a fazer.');
    return;
  }

  const places = await prisma.place.findMany({
    where: { OR: [{ phone: null }, { website: null }] },
  });

  console.log(`🔎 ${places.length} estabelecimento(s) para enriquecer...`);

  for (const place of places) {
    const enrichment = await enrichPlaceFromGoogle(place.name, place.city);

    if (!enrichment) {
      console.log(`  ⏭️  ${place.name}: sem dados encontrados`);
      continue;
    }

    await prisma.place.update({
      where: { id: place.id },
      data: {
        phone: place.phone ?? enrichment.phone,
        website: place.website ?? enrichment.website,
      },
    });

    console.log(`  ✅ ${place.name}: enriquecido`);
  }

  console.log('✅ Enriquecimento concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
