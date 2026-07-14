/**
 * Popula o banco com estabelecimentos reais via Google Places Nearby Search,
 * por geolocalização — diferente de enrichPlaces.ts, que só complementa
 * places já existentes. Este script é a fonte real de dados (Fase 1).
 *
 * Uso:
 *   npm run places:discover -- --lat=-22.3711 --lng=-41.7867 --radius=5000 --city=Macaé
 *
 * Sem GOOGLE_PLACES_API_KEY configurada, encerra sem custo e sem alterar dados.
 * Idempotente: places já descobertos (mesmo google_place_id) são atualizados,
 * nunca duplicados.
 */
import { prisma } from './prisma';
import { nearbySearch } from '../services/mapsService';
import { env } from '../config/env';

// Mapeia categorias do produto para o `type` aceito pela Nearby Search API.
// https://developers.google.com/maps/documentation/places/web-service/supported_types
const CATEGORY_TO_GOOGLE_TYPE: Record<string, string> = {
  restaurante: 'restaurant',
  farmacia: 'pharmacy',
  'pet-shop': 'pet_store',
  supermercado: 'supermarket',
};

const DEFAULT_RADIUS_METERS = 5_000;

interface Args {
  lat: number;
  lng: number;
  radiusMeters: number;
  city: string;
  categories: string[];
}

function parseArgs(): Args {
  const args = new Map(
    process.argv.slice(2).map((arg) => {
      const [key, value] = arg.replace(/^--/, '').split('=');
      return [key, value];
    }),
  );

  const lat = Number(args.get('lat'));
  const lng = Number(args.get('lng'));
  const city = args.get('city');

  if (Number.isNaN(lat) || Number.isNaN(lng) || !city) {
    console.error('Uso: tsx src/db/discoverPlaces.ts --lat=<num> --lng=<num> --city=<nome> [--radius=<metros>] [--category=<slug>]');
    process.exit(1);
  }

  const categoryArg = args.get('category');
  const categories = categoryArg ? [categoryArg] : Object.keys(CATEGORY_TO_GOOGLE_TYPE);

  for (const slug of categories) {
    if (!CATEGORY_TO_GOOGLE_TYPE[slug]) {
      console.error(`Categoria desconhecida: "${slug}". Válidas: ${Object.keys(CATEGORY_TO_GOOGLE_TYPE).join(', ')}`);
      process.exit(1);
    }
  }

  return {
    lat,
    lng,
    city,
    radiusMeters: Number(args.get('radius')) || DEFAULT_RADIUS_METERS,
    categories,
  };
}

async function main() {
  if (!env.GOOGLE_PLACES_API_KEY) {
    console.log('⚠️  GOOGLE_PLACES_API_KEY não configurada — nada a fazer.');
    return;
  }

  const { lat, lng, radiusMeters, city, categories } = parseArgs();

  for (const slug of categories) {
    const category = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { slug, label: slug },
    });

    const googleType = CATEGORY_TO_GOOGLE_TYPE[slug];
    console.log(`🔎 Buscando "${googleType}" em raio de ${radiusMeters}m (${lat}, ${lng})...`);

    const found = await nearbySearch(lat, lng, radiusMeters, googleType);
    console.log(`  ${found.length} resultado(s) da API`);

    for (const place of found) {
      const result = await prisma.place.upsert({
        where: { googlePlaceId: place.googlePlaceId },
        update: {
          name: place.name,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
        },
        create: {
          googlePlaceId: place.googlePlaceId,
          name: place.name,
          address: place.address || 'Endereço não informado',
          city,
          lat: place.lat,
          lng: place.lng,
          categoryId: category.id,
        },
      });
      console.log(`  ✅ ${result.name}`);
    }
  }

  console.log('✅ Descoberta concluída. Rode "npm run places:enrich" para telefone/website.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
