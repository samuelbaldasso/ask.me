import { z } from 'zod';
import type { PaginatedResult, PlaceResult, SearchFilters } from '../types/place';

const DEFAULT_RADIUS_METERS = 5_000;

export const searchQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(50_000).optional(),
  category: z.string().optional(),
  openNow: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  acceptsPets: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

export async function searchPlacesService(
  query: SearchQuery,
): Promise<PaginatedResult<PlaceResult>> {
  // Import dinâmico do repository evita que env.ts seja executado em testes unitários
  const { searchPlaces } = await import('../repositories/placeRepository');
  const { ensureRegionDiscovered } = await import('./discoveryService');

  // Descoberta automática: garante que a região já foi varrida via Google
  // Places antes de consultar o Postgres (ver discoveryService.ts). Nunca
  // lança — se falhar, a busca segue normalmente com o que já está no banco.
  await ensureRegionDiscovered(query.lat, query.lng, query.radius ?? DEFAULT_RADIUS_METERS, query.category);

  const filters: SearchFilters = {
    lat: query.lat,
    lng: query.lng,
    radiusMeters: query.radius,
    categorySlug: query.category,
    openNow: query.openNow,
    acceptsPets: query.acceptsPets,
    limit: query.limit,
    offset: query.offset,
  };

  return searchPlaces(filters);
}
