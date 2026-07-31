export interface PlaceCategory {
  slug: string;
  label: string;
}

export interface Place {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  category: PlaceCategory;
  acceptsPets: boolean;
  acceptsCards: boolean;
  hasParking: boolean;
  phone: string | null;
  website: string | null;
  whatsappNumber: string | null;
  menuUrl: string | null;
  photoUrls: string[];
  isOpenNow: boolean | null;
  isFeatured: boolean;
}

export function distanceLabel(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export interface SearchFilters {
  lat: number;
  lng: number;
  radiusMeters: number;
  categorySlug?: string;
  openNow: boolean;
  acceptsPets: boolean;
  limit: number;
  offset: number;
}

export const defaultSearchFilters = (
  lat: number,
  lng: number,
): SearchFilters => ({
  lat,
  lng,
  radiusMeters: 5000,
  openNow: false,
  acceptsPets: false,
  limit: 20,
  offset: 0,
});

export function searchFiltersToQuery(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams({
    lat: String(filters.lat),
    lng: String(filters.lng),
    radius: String(filters.radiusMeters),
    limit: String(filters.limit),
    offset: String(filters.offset),
  });
  if (filters.categorySlug) params.set('category', filters.categorySlug);
  if (filters.openNow) params.set('openNow', 'true');
  if (filters.acceptsPets) params.set('acceptsPets', 'true');
  return params;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export function hasMore(result: PaginatedResult<unknown>): boolean {
  return result.offset + result.data.length < result.total;
}

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export type SubscriptionStatusValue =
  | 'none'
  | 'incomplete'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid';

export interface SubscriptionStatus {
  status: SubscriptionStatusValue;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface AskResult {
  answer: string;
  usedAi: boolean;
  results: PaginatedResult<Place>;
}

// --- Painel do lojista (B2B) ---

export interface BusinessPlace {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  phone: string | null;
  website: string | null;
  whatsappNumber: string | null;
  menuUrl: string | null;
  photoUrls: string[];
  acceptsPets: boolean;
  acceptsCards: boolean;
  hasParking: boolean;
  category: PlaceCategory;
}

export interface ClaimableBusinessPlace extends BusinessPlace {
  isClaimed: boolean;
  isMine: boolean;
}

export interface MyBusiness {
  places: BusinessPlace[];
  subscription: SubscriptionStatus;
}

export type ClickEventType =
  | 'phone_click'
  | 'whatsapp_click'
  | 'website_click'
  | 'route_click'
  | 'menu_click';

export type PlaceEventType = 'view' | ClickEventType;

export interface PlaceStats {
  windowDays: number;
  viewsTotal: number;
  clicksTotal: number;
  viewsLast30Days: number;
  clicksLast30Days: number;
  clicksByType: Record<ClickEventType, number>;
  clicksByTypeLast30Days: Record<ClickEventType, number>;
}

export interface UpdatePlaceProfileInput {
  description?: string | null;
  phone?: string | null;
  website?: string | null;
  whatsappNumber?: string | null;
  menuUrl?: string | null;
  photoUrls?: string[];
  acceptsPets?: boolean;
  acceptsCards?: boolean;
  hasParking?: boolean;
}

export interface OpeningHour {
  dayOfWeek: number; // 0=domingo, 6=sábado
  opensAt: string; // "HH:MM"
  closesAt: string; // "HH:MM"
  isClosed: boolean;
}

export const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
