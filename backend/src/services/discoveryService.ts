// Descoberta automática sob demanda: garante que uma região de busca já foi
// varrida via Google Places antes da query no Postgres, sem depender de
// alguém rodar o script manual (src/db/discoverPlaces.ts) para cada cidade.
//
// Controle de custo: a região é reduzida a uma célula de grade de ~1,1km
// (lat/lng arredondados a 2 casas) e a descoberta só é refeita depois de
// DISCOVERY_TTL_DAYS — buscas repetidas na mesma área não geram novas
// chamadas ao Google, só a primeira busca de cada região por ciclo.
import { prisma } from '../db/prisma';
import { nearbySearch } from './mapsService';
import { env } from '../config/env';
import { CATEGORY_TO_GOOGLE_TYPE } from '../config/categories';

const DISCOVERY_TTL_DAYS = 30;
const GRID_PRECISION = 2; // ~1,1km por célula

function toGridCell(value: number): number {
  return Math.round(value * 10 ** GRID_PRECISION) / 10 ** GRID_PRECISION;
}

/**
 * Garante que a região ao redor de (lat, lng) foi descoberta recentemente
 * para as categorias relevantes. Nunca lança — falhas de rede/API não devem
 * derrubar a busca do usuário (mesmo fallback silencioso de mapsService).
 */
export async function ensureRegionDiscovered(
  lat: number,
  lng: number,
  radiusMeters: number,
  categorySlug?: string,
): Promise<void> {
  if (!env.GOOGLE_PLACES_API_KEY) return;

  const categories = categorySlug ? [categorySlug] : Object.keys(CATEGORY_TO_GOOGLE_TYPE);
  const latCell = toGridCell(lat);
  const lngCell = toGridCell(lng);
  const ttlCutoff = new Date(Date.now() - DISCOVERY_TTL_DAYS * 24 * 60 * 60 * 1000);

  for (const slug of categories) {
    const googleType = CATEGORY_TO_GOOGLE_TYPE[slug];
    if (!googleType) continue;

    try {
      const existing = await prisma.discoveredRegion.findUnique({
        where: { latCell_lngCell_categorySlug: { latCell, lngCell, categorySlug: slug } },
      });
      if (existing && existing.discoveredAt > ttlCutoff) continue;

      const found = await nearbySearch(lat, lng, radiusMeters, googleType);

      const category = await prisma.category.upsert({
        where: { slug },
        update: {},
        create: { slug, label: slug },
      });

      for (const place of found) {
        await prisma.place.upsert({
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
            // Cidade não é conhecida a partir de lat/lng sem geocodificação
            // reversa (custo extra) — dívida técnica para Fase 6.
            city: 'Não informada',
            address: place.address || 'Endereço não informado',
            lat: place.lat,
            lng: place.lng,
            categoryId: category.id,
          },
        });
      }

      await prisma.discoveredRegion.upsert({
        where: { latCell_lngCell_categorySlug: { latCell, lngCell, categorySlug: slug } },
        update: { discoveredAt: new Date() },
        create: { latCell, lngCell, categorySlug: slug },
      });
    } catch (err) {
      console.error(`[discoveryService] Falha ao descobrir região para "${slug}":`, (err as Error).message);
    }
  }
}
