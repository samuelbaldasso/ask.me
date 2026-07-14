// Tipos de domínio compartilhados entre camadas

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface SearchFilters {
  query?: string;           // texto livre (usado na Fase 3)
  categorySlug?: string;    // ex: "restaurante"
  lat: number;
  lng: number;
  radiusMeters?: number;    // default: 5000 (5km)
  openNow?: boolean;        // filtrar por horário atual
  acceptsPets?: boolean;
  limit?: number;           // default: 20
  offset?: number;          // paginação
}

export interface PlaceResult {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  category: {
    slug: string;
    label: string;
  };
  acceptsPets: boolean;
  acceptsCards: boolean;
  hasParking: boolean;
  phone: string | null;
  website: string | null;
  isOpenNow: boolean | null; // null = sem horário cadastrado
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface NlSearchResult {
  answer: string;
  usedAi: boolean;
  results: PaginatedResult<PlaceResult>;
}
