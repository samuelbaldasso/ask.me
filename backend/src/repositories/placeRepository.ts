import { prisma } from '../db/prisma';
import type { SearchFilters, PlaceResult, PaginatedResult, GeoPoint } from '../types/place';
import { isOpenNow } from '../utils/schedule';

const DEFAULT_RADIUS_METERS = 5_000;
const DEFAULT_LIMIT = 20;

/**
 * Busca estabelecimentos por proximidade usando PostGIS (ST_DWithin).
 *
 * Decisão: SQL raw para a parte espacial — o Prisma ORM não suporta
 * ST_DWithin nativamente. Tudo mais (joins, filtros booleanos) usa
 * Prisma para manter legibilidade e segurança contra SQL injection
 * nos parâmetros não-espaciais.
 *
 * Dívida técnica (Fase 6): extrair a query para uma view materializada
 * ou índice parcial quando o volume de places for > 50k.
 */
export async function searchPlaces(
  filters: SearchFilters,
): Promise<PaginatedResult<PlaceResult>> {
  const {
    lat,
    lng,
    radiusMeters = DEFAULT_RADIUS_METERS,
    categorySlug,
    openNow,
    acceptsPets,
    limit = DEFAULT_LIMIT,
    offset = 0,
  } = filters;

  // Monta cláusulas WHERE adicionais (seguras — valores nunca interpolados)
  const conditions: string[] = [
    `ST_DWithin(p.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)`,
    `p.is_active = true`,
  ];
  const params: unknown[] = [lat, lng, radiusMeters];
  let paramIdx = 4;

  if (categorySlug) {
    conditions.push(`c.slug = $${paramIdx++}`);
    params.push(categorySlug);
  }

  if (acceptsPets === true) {
    conditions.push(`p.accepts_pets = true`);
  }

  const whereClause = conditions.join(' AND ');

  // Query principal — retorna distância em metros junto com os dados
  const rows = await prisma.$queryRawUnsafe<RawPlaceRow[]>(
    [
      `SELECT`,
      `  p.id, p.name, p.description, p.address, p.city, p.lat, p.lng,`,
      `  p.accepts_pets, p.accepts_cards, p.has_parking, p.phone, p.website,`,
      `  c.slug AS category_slug, c.label AS category_label,`,
      `  ST_Distance(p.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) AS distance_meters`,
      `FROM places p`,
      `JOIN categories c ON c.id = p.category_id`,
      `WHERE ${whereClause}`,
      `ORDER BY distance_meters ASC`,
      `LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    ].join('\n'),
    ...params,
    limit,
    offset,
  );

  // Count total para paginação (mesma cláusula WHERE, sem LIMIT)
  const [{ count }] = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `
    SELECT COUNT(*) AS count
    FROM places p
    JOIN categories c ON c.id = p.category_id
    WHERE ${whereClause}
    `,
    ...params,
  );

  // Buscar horários apenas dos places retornados (evita N+1)
  const placeIds = (rows as RawPlaceRow[]).map((r: RawPlaceRow) => r.id);
  const hoursMap = await fetchOpeningHoursMap(placeIds);

  const data: PlaceResult[] = (rows as RawPlaceRow[]).map((row: RawPlaceRow) => {
    const hours = hoursMap[row.id] ?? [];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      address: row.address,
      city: row.city,
      lat: row.lat,
      lng: row.lng,
      distanceMeters: Math.round(Number(row.distance_meters)),
      category: {
        slug: row.category_slug,
        label: row.category_label,
      },
      acceptsPets: row.accepts_pets,
      acceptsCards: row.accepts_cards,
      hasParking: row.has_parking,
      phone: row.phone,
      website: row.website,
      isOpenNow: hours.length > 0 ? isOpenNow(hours) : null,
    };
  });

  // Filtro openNow em memória (após busca) — simples para o MVP.
  // Dívida técnica: mover para SQL na Fase 6 se o filtro se tornar gargalo.
  // Como o filtro roda em memória sobre a página atual, `total` reflete
  // apenas os itens retornados nesta página (não o total real no banco)
  // para manter `total === data.length` consistente com o filtro aplicado.
  const filtered =
    openNow === true ? data.filter((p) => p.isOpenNow === true) : data;

  return {
    data: filtered,
    total: openNow === true ? filtered.length : Number(count),
    limit,
    offset,
  };
}

/**
 * Busca places específicos (por id) com distância a partir de um ponto de
 * referência — usado pela tela de favoritos, que não tem um raio de busca,
 * apenas uma lista fixa de ids já favoritados pelo usuário.
 */
export async function getPlacesByIds(
  placeIds: string[],
  origin: GeoPoint,
): Promise<PlaceResult[]> {
  if (placeIds.length === 0) return [];

  const rows = await prisma.$queryRawUnsafe<RawPlaceRow[]>(
    `
    SELECT
      p.id, p.name, p.description, p.address, p.city, p.lat, p.lng,
      p.accepts_pets, p.accepts_cards, p.has_parking, p.phone, p.website,
      c.slug AS category_slug, c.label AS category_label,
      ST_Distance(p.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) AS distance_meters
    FROM places p
    JOIN categories c ON c.id = p.category_id
    WHERE p.id = ANY($3) AND p.is_active = true
    ORDER BY distance_meters ASC
    `,
    origin.lat,
    origin.lng,
    placeIds,
  );

  const hoursMap = await fetchOpeningHoursMap(rows.map((r) => r.id));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    address: row.address,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    distanceMeters: Math.round(Number(row.distance_meters)),
    category: {
      slug: row.category_slug,
      label: row.category_label,
    },
    acceptsPets: row.accepts_pets,
    acceptsCards: row.accepts_cards,
    hasParking: row.has_parking,
    phone: row.phone,
    website: row.website,
    isOpenNow: (hoursMap[row.id] ?? []).length > 0 ? isOpenNow(hoursMap[row.id]) : null,
  }));
}

// ---------------------------------------------------------------------------
// Helpers privados
// ---------------------------------------------------------------------------

interface RawPlaceRow {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  lat: number;
  lng: number;
  accepts_pets: boolean;
  accepts_cards: boolean;
  has_parking: boolean;
  phone: string | null;
  website: string | null;
  category_slug: string;
  category_label: string;
  distance_meters: number | bigint;
}

async function fetchOpeningHoursMap(
  placeIds: string[],
): Promise<Record<string, Array<{ dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean }>>> {
  if (placeIds.length === 0) return {};

  const hours = await prisma.openingHours.findMany({
    where: { placeId: { in: placeIds } },
    select: { placeId: true, dayOfWeek: true, opensAt: true, closesAt: true, isClosed: true },
  });

  type HourRow = (typeof hours)[number];
  return hours.reduce<Record<string, HourRow[]>>(
    (acc: Record<string, HourRow[]>, h: HourRow) => {
      (acc[h.placeId] ??= []).push(h);
      return acc;
    },
    {},
  );
}
