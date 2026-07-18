import { prisma } from '../db/prisma';

export async function addFavorite(userId: string, placeId: string): Promise<void> {
  await prisma.favorite.upsert({
    where: { userId_placeId: { userId, placeId } },
    create: { userId, placeId },
    update: {},
  });
}

export async function removeFavorite(userId: string, placeId: string): Promise<void> {
  await prisma.favorite.deleteMany({ where: { userId, placeId } });
}

export async function listFavoritePlaceIds(userId: string): Promise<string[]> {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { placeId: true },
  });

  return favorites.map((f) => f.placeId);
}
