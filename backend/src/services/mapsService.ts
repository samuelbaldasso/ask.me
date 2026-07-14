// Integração com Google Places API — enriquecimento de dados de estabelecimentos.
//
// Decisão de custo (Fase 1, ver docs/agent.md): chamadas são feitas sob demanda
// via script de enriquecimento (src/db/enrichPlaces.ts), nunca no caminho de
// busca do usuário — assim o custo de API não escala com tráfego, só com o
// tamanho da base de estabelecimentos.
//
// Sem GOOGLE_PLACES_API_KEY configurada, todas as funções retornam null
// (fallback silencioso) — nunca lançam para não travar o script de seed/enrich.

import { env } from '../config/env';

const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';
const REQUEST_TIMEOUT_MS = 5_000;

export interface PlaceEnrichment {
  phone: string | null;
  website: string | null;
  formattedAddress: string | null;
}

export interface NearbyPlace {
  googlePlaceId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

/**
 * Busca estabelecimentos reais por geolocalização via Google Places
 * Nearby Search — fonte dos dados que populam o banco (src/db/discoverPlaces.ts).
 *
 * Paginação: a API do Google retorna no máximo 20 resultados por página e
 * exige aguardar a `next_page_token` "ativar" antes de ser usada — para o
 * MVP buscamos só a primeira página (20 lugares por execução), suficiente
 * para validar uma região sem custo/latência de paginação encadeada.
 */
export async function nearbySearch(
  lat: number,
  lng: number,
  radiusMeters: number,
  googleType: string,
): Promise<NearbyPlace[]> {
  if (!env.GOOGLE_PLACES_API_KEY) {
    return [];
  }

  const url = new URL(`${GOOGLE_PLACES_BASE_URL}/nearbysearch/json`);
  url.searchParams.set('location', `${lat},${lng}`);
  url.searchParams.set('radius', String(radiusMeters));
  url.searchParams.set('type', googleType);
  url.searchParams.set('key', env.GOOGLE_PLACES_API_KEY);

  try {
    const res = await fetchWithTimeout(url.toString());
    const body = (await res.json()) as {
      status: string;
      results?: Array<{
        place_id: string;
        name: string;
        vicinity?: string;
        geometry?: { location?: { lat: number; lng: number } };
      }>;
    };

    if (body.status !== 'OK' && body.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API retornou status ${body.status}`);
    }

    return (body.results ?? [])
      .filter((r) => r.geometry?.location)
      .map((r) => ({
        googlePlaceId: r.place_id,
        name: r.name,
        address: r.vicinity ?? '',
        lat: r.geometry!.location!.lat,
        lng: r.geometry!.location!.lng,
      }));
  } catch (err) {
    console.error('[mapsService] Falha na busca por proximidade:', (err as Error).message);
    return [];
  }
}

export async function enrichPlaceFromGoogle(
  name: string,
  city: string,
): Promise<PlaceEnrichment | null> {
  if (!env.GOOGLE_PLACES_API_KEY) {
    return null;
  }

  try {
    const placeId = await findPlaceId(`${name}, ${city}`);
    if (!placeId) return null;
    return await fetchPlaceDetails(placeId);
  } catch (err) {
    console.error(`[mapsService] Falha ao enriquecer "${name}":`, (err as Error).message);
    return null;
  }
}

async function findPlaceId(query: string): Promise<string | null> {
  const url = new URL(`${GOOGLE_PLACES_BASE_URL}/findplacefromtext/json`);
  url.searchParams.set('input', query);
  url.searchParams.set('inputtype', 'textquery');
  url.searchParams.set('fields', 'place_id');
  url.searchParams.set('key', env.GOOGLE_PLACES_API_KEY!);

  const res = await fetchWithTimeout(url.toString());
  const body = (await res.json()) as {
    status: string;
    candidates?: Array<{ place_id: string }>;
  };

  if (body.status !== 'OK' || !body.candidates?.length) {
    return null;
  }
  return body.candidates[0].place_id;
}

async function fetchPlaceDetails(placeId: string): Promise<PlaceEnrichment | null> {
  const url = new URL(`${GOOGLE_PLACES_BASE_URL}/details/json`);
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'formatted_phone_number,website,formatted_address');
  url.searchParams.set('key', env.GOOGLE_PLACES_API_KEY!);

  const res = await fetchWithTimeout(url.toString());
  const body = (await res.json()) as {
    status: string;
    result?: {
      formatted_phone_number?: string;
      website?: string;
      formatted_address?: string;
    };
  };

  if (body.status !== 'OK' || !body.result) {
    return null;
  }

  return {
    phone: body.result.formatted_phone_number ?? null,
    website: body.result.website ?? null,
    formattedAddress: body.result.formatted_address ?? null,
  };
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Google Places API respondeu HTTP ${res.status}`);
    }
    return res;
  } finally {
    clearTimeout(timer);
  }
}
