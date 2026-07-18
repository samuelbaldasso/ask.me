import { z } from 'zod';
import type { PaginatedResult, PlaceResult } from '../types/place';

export const favoritesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const favoriteBodySchema = z.object({
  placeId: z.string().min(1),
});

export async function addFavoriteService(userId: string, placeId: string): Promise<void> {
  // Import dinâmico do repository evita que env.ts seja executado em testes unitários
  const { addFavorite } = await import('../repositories/favoriteRepository');
  await addFavorite(userId, placeId);
}

export async function removeFavoriteService(userId: string, placeId: string): Promise<void> {
  const { removeFavorite } = await import('../repositories/favoriteRepository');
  await removeFavorite(userId, placeId);
}

export async function listFavoritesService(
  userId: string,
  lat: number,
  lng: number,
): Promise<PaginatedResult<PlaceResult>> {
  const { listFavoritePlaceIds } = await import('../repositories/favoriteRepository');
  const { getPlacesByIds } = await import('../repositories/placeRepository');

  const placeIds = await listFavoritePlaceIds(userId);
  const data = await getPlacesByIds(placeIds, { lat, lng });

  return { data, total: data.length, limit: data.length, offset: 0 };
}
