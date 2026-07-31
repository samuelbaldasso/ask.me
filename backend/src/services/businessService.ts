import { z } from 'zod';
import { prisma } from '../db/prisma';

class BusinessServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const claimSearchQuerySchema = z.object({
  q: z.string().min(2),
});

export const claimBodySchema = z.object({
  placeId: z.string().min(1),
});

export const updatePlaceBodySchema = z.object({
  description: z.string().max(1000).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  website: z.string().max(255).nullable().optional(),
  whatsappNumber: z.string().max(30).nullable().optional(),
  menuUrl: z.string().max(255).nullable().optional(),
  acceptsPets: z.boolean().optional(),
  acceptsCards: z.boolean().optional(),
  hasParking: z.boolean().optional(),
});

const PLACE_SUMMARY_SELECT = {
  id: true,
  name: true,
  description: true,
  address: true,
  city: true,
  phone: true,
  website: true,
  whatsappNumber: true,
  menuUrl: true,
  acceptsPets: true,
  acceptsCards: true,
  hasParking: true,
  ownerId: true,
  category: { select: { slug: true, label: true } },
} as const;

/**
 * Busca estabelecimentos por nome para o lojista encontrar o próprio
 * negócio na base já importada e reivindicá-lo — não filtra por dono, mas o
 * client sinaliza `isClaimed`/`isMine` para orientar a UI.
 */
export async function searchClaimablePlaces(query: string, userId: string) {
  const places = await prisma.place.findMany({
    where: { name: { contains: query, mode: 'insensitive' }, isActive: true },
    select: PLACE_SUMMARY_SELECT,
    take: 20,
    orderBy: { name: 'asc' },
  });

  return places.map((p) => ({
    ...p,
    isClaimed: p.ownerId !== null,
    isMine: p.ownerId === userId,
    ownerId: undefined,
  }));
}

/**
 * Vincula um Place sem dono à conta do lojista logado. MVP não faz
 * verificação forte de propriedade (ex: confirmação por telefone/documento)
 * — qualquer usuário pode reivindicar um estabelecimento ainda não
 * reivindicado, mesma lógica adotada por diretórios como Google Meu Negócio
 * no início antes da verificação por correio.
 */
export async function claimPlace(userId: string, placeId: string) {
  const place = await prisma.place.findUnique({ where: { id: placeId }, select: { ownerId: true } });

  if (!place) {
    throw new BusinessServiceError('Estabelecimento não encontrado', 404);
  }

  if (place.ownerId && place.ownerId !== userId) {
    throw new BusinessServiceError('Esse estabelecimento já foi reivindicado por outra conta', 409);
  }

  await prisma.place.update({ where: { id: placeId }, data: { ownerId: userId } });
}

export async function getMyBusiness(userId: string) {
  const [places, subscription] = await Promise.all([
    prisma.place.findMany({
      where: { ownerId: userId },
      select: PLACE_SUMMARY_SELECT,
      orderBy: { name: 'asc' },
    }),
    prisma.subscription.findUnique({
      where: { userId },
      select: { status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
    }),
  ]);

  return {
    places: places.map((p) => ({ ...p, ownerId: undefined })),
    subscription: subscription ?? { status: 'none' as const, currentPeriodEnd: null, cancelAtPeriodEnd: false },
  };
}

async function assertOwnership(userId: string, placeId: string): Promise<void> {
  const place = await prisma.place.findUnique({ where: { id: placeId }, select: { ownerId: true } });

  if (!place) {
    throw new BusinessServiceError('Estabelecimento não encontrado', 404);
  }

  if (place.ownerId !== userId) {
    throw new BusinessServiceError('Você não gerencia esse estabelecimento', 403);
  }
}

export async function updatePlaceProfile(
  userId: string,
  placeId: string,
  data: z.infer<typeof updatePlaceBodySchema>,
) {
  await assertOwnership(userId, placeId);

  const updated = await prisma.place.update({
    where: { id: placeId },
    data,
    select: PLACE_SUMMARY_SELECT,
  });

  return { ...updated, ownerId: undefined };
}

const REPORT_WINDOW_DAYS = 30;

// Tipos de clique rastreados no perfil — cada um vira uma linha própria no
// relatório do lojista (ver docs do plano de ação B2B, Fase 4: "Ver Rota",
// "Abrir WhatsApp", "Ver Cardápio" são os eventos que provam valor).
const CLICK_EVENT_TYPES = ['phone_click', 'whatsapp_click', 'website_click', 'route_click', 'menu_click'] as const;
export type ClickEventType = (typeof CLICK_EVENT_TYPES)[number];
export type PlaceEventType = 'view' | ClickEventType;

async function countByType(placeId: string, type: PlaceEventType, since?: Date) {
  return prisma.placeEvent.count({
    where: { placeId, type, ...(since ? { createdAt: { gte: since } } : {}) },
  });
}

export async function getPlaceStats(userId: string, placeId: string) {
  await assertOwnership(userId, placeId);

  const since = new Date(Date.now() - REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [viewsTotal, viewsLast30Days, clicksByType, clicksByTypeLast30Days] = await Promise.all([
    countByType(placeId, 'view'),
    countByType(placeId, 'view', since),
    Promise.all(CLICK_EVENT_TYPES.map(async (type) => [type, await countByType(placeId, type)] as const)),
    Promise.all(
      CLICK_EVENT_TYPES.map(async (type) => [type, await countByType(placeId, type, since)] as const),
    ),
  ]);

  const clicks = Object.fromEntries(clicksByType) as Record<ClickEventType, number>;
  const clicksLast30Days = Object.fromEntries(clicksByTypeLast30Days) as Record<ClickEventType, number>;
  const clicksTotal = CLICK_EVENT_TYPES.reduce((sum, type) => sum + clicks[type], 0);
  const clicksTotalLast30Days = CLICK_EVENT_TYPES.reduce((sum, type) => sum + clicksLast30Days[type], 0);

  return {
    windowDays: REPORT_WINDOW_DAYS,
    viewsTotal,
    viewsLast30Days,
    clicksTotal,
    clicksLast30Days: clicksTotalLast30Days,
    clicksByType: clicks,
    clicksByTypeLast30Days: clicksLast30Days,
  };
}

export const trackEventBodySchema = z.object({
  type: z.enum(['view', ...CLICK_EVENT_TYPES]),
});

/** Registra um evento de visualização/clique — usado pelo relatório do lojista. */
export async function trackPlaceEvent(placeId: string, type: PlaceEventType): Promise<void> {
  const place = await prisma.place.findUnique({ where: { id: placeId }, select: { id: true } });
  if (!place) return; // silencioso — evita vazar existência de ids inválidos

  await prisma.placeEvent.create({ data: { placeId, type } });
}

export { BusinessServiceError };
