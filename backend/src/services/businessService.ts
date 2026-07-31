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
  photoUrls: z.array(z.string().max(500)).max(6).optional(),
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
  photoUrls: true,
  acceptsPets: true,
  acceptsCards: true,
  hasParking: true,
  ownerId: true,
  category: { select: { slug: true, label: true } },
} as const;

/**
 * Busca estabelecimentos por nome para o lojista encontrar o próprio
 * negócio na base já importada e reivindicá-lo — não filtra por dono, mas o
 * client sinaliza `isClaimed`/`isMine`/`myClaimStatus` para orientar a UI.
 */
export async function searchClaimablePlaces(query: string, userId: string) {
  const places = await prisma.place.findMany({
    where: { name: { contains: query, mode: 'insensitive' }, isActive: true },
    select: {
      ...PLACE_SUMMARY_SELECT,
      claims: { where: { userId }, select: { status: true } },
    },
    take: 20,
    orderBy: { name: 'asc' },
  });

  return places.map((p) => ({
    ...p,
    isClaimed: p.ownerId !== null,
    isMine: p.ownerId === userId,
    myClaimStatus: p.claims[0]?.status ?? null,
    claims: undefined,
    ownerId: undefined,
  }));
}

/**
 * Cria um pedido de reivindicação de um Place sem dono — não vincula a
 * conta automaticamente. Fica com status "pending" até um admin aprovar em
 * /admin/claims (ver adminService), pra evitar que qualquer usuário
 * logado assuma a gestão de um estabelecimento alheio.
 */
export async function claimPlace(userId: string, placeId: string) {
  const place = await prisma.place.findUnique({ where: { id: placeId }, select: { ownerId: true } });

  if (!place) {
    throw new BusinessServiceError('Estabelecimento não encontrado', 404);
  }

  if (place.ownerId) {
    if (place.ownerId === userId) return { status: 'approved' as const };
    throw new BusinessServiceError('Esse estabelecimento já foi reivindicado por outra conta', 409);
  }

  const claim = await prisma.businessClaim.upsert({
    where: { placeId_userId: { placeId, userId } },
    update: { status: 'pending', reviewedAt: null },
    create: { placeId, userId },
    select: { status: true },
  });

  return claim;
}

export async function getMyBusiness(userId: string) {
  const [places, subscription, pendingClaims] = await Promise.all([
    prisma.place.findMany({
      where: { ownerId: userId },
      select: PLACE_SUMMARY_SELECT,
      orderBy: { name: 'asc' },
    }),
    prisma.subscription.findUnique({
      where: { userId },
      select: { status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
    }),
    prisma.businessClaim.findMany({
      where: { userId, status: { in: ['pending', 'rejected', 'revoked'] } },
      select: {
        id: true,
        status: true,
        createdAt: true,
        place: { select: { id: true, name: true, address: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    places: places.map((p) => ({ ...p, ownerId: undefined })),
    subscription: subscription ?? { status: 'none' as const, currentPeriodEnd: null, cancelAtPeriodEnd: false },
    pendingClaims,
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

// --- Horário de funcionamento ---

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const updateOpeningHoursBodySchema = z.object({
  hours: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        opensAt: z.string().regex(TIME_REGEX, 'Formato esperado: HH:MM'),
        closesAt: z.string().regex(TIME_REGEX, 'Formato esperado: HH:MM'),
        isClosed: z.boolean(),
      }),
    )
    .min(1)
    .max(7)
    .refine((hours) => new Set(hours.map((h) => h.dayOfWeek)).size === hours.length, {
      message: 'dayOfWeek não pode se repetir',
    }),
});

export async function getOpeningHours(userId: string, placeId: string) {
  await assertOwnership(userId, placeId);

  return prisma.openingHours.findMany({
    where: { placeId },
    select: { dayOfWeek: true, opensAt: true, closesAt: true, isClosed: true },
    orderBy: { dayOfWeek: 'asc' },
  });
}

/** Substitui o horário de um ou mais dias da semana (upsert por dayOfWeek). */
export async function updateOpeningHours(
  userId: string,
  placeId: string,
  hours: z.infer<typeof updateOpeningHoursBodySchema>['hours'],
) {
  await assertOwnership(userId, placeId);

  await prisma.$transaction(
    hours.map((h) =>
      prisma.openingHours.upsert({
        where: { placeId_dayOfWeek: { placeId, dayOfWeek: h.dayOfWeek } },
        update: { opensAt: h.opensAt, closesAt: h.closesAt, isClosed: h.isClosed },
        create: { placeId, dayOfWeek: h.dayOfWeek, opensAt: h.opensAt, closesAt: h.closesAt, isClosed: h.isClosed },
      }),
    ),
  );

  return getOpeningHours(userId, placeId);
}

export { BusinessServiceError };
