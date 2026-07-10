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
