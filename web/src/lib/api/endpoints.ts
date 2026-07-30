import { apiFetch } from './client';
import type {
  AskResult,
  BusinessPlace,
  ClaimableBusinessPlace,
  MyBusiness,
  PaginatedResult,
  Place,
  PlaceStats,
  SearchFilters,
  SubscriptionStatus,
  UpdatePlaceProfileInput,
  AppUser,
} from '../types';
import { searchFiltersToQuery as toQuery } from '../types';

export function searchPlaces(
  filters: SearchFilters,
): Promise<PaginatedResult<Place>> {
  return apiFetch<PaginatedResult<Place>>('/places', { query: toQuery(filters) });
}

export function ask(query: string, lat: number, lng: number): Promise<AskResult> {
  return apiFetch<AskResult>('/ask', { method: 'POST', body: { query, lat, lng } });
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export function geocode(address: string): Promise<GeocodeResult> {
  return apiFetch<GeocodeResult>('/geocode', { query: { address } });
}

export function loginWithGoogle(
  idToken: string,
): Promise<{ token: string; isNewUser: boolean; user: AppUser }> {
  return apiFetch('/auth/google', { method: 'POST', body: { idToken } });
}

export function listFavorites(
  lat: number,
  lng: number,
): Promise<PaginatedResult<Place>> {
  return apiFetch<PaginatedResult<Place>>('/favorites', {
    query: { lat: String(lat), lng: String(lng) },
  });
}

export function addFavorite(placeId: string): Promise<void> {
  return apiFetch('/favorites', { method: 'POST', body: { placeId } });
}

export function removeFavorite(placeId: string): Promise<void> {
  return apiFetch(`/favorites/${placeId}`, { method: 'DELETE' });
}

export function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  return apiFetch<SubscriptionStatus>('/subscriptions/me');
}

export function createCheckoutSession(): Promise<{ url: string }> {
  return apiFetch('/subscriptions/checkout', { method: 'POST' });
}

export function createBillingPortalSession(): Promise<{ url: string }> {
  return apiFetch('/subscriptions/portal', { method: 'POST' });
}

export function trackPlaceEvent(placeId: string, type: 'view' | 'click'): Promise<void> {
  return apiFetch(`/places/${placeId}/track`, { method: 'POST', body: { type } });
}

// --- Painel do lojista (B2B) ---

export function searchClaimablePlaces(
  q: string,
): Promise<{ data: ClaimableBusinessPlace[] }> {
  return apiFetch('/business/places/search', { query: { q } });
}

export function claimBusinessPlace(placeId: string): Promise<{ claimed: boolean }> {
  return apiFetch('/business/claim', { method: 'POST', body: { placeId } });
}

export function getMyBusiness(): Promise<MyBusiness> {
  return apiFetch('/business/me');
}

export function updateBusinessPlace(
  placeId: string,
  data: UpdatePlaceProfileInput,
): Promise<BusinessPlace> {
  return apiFetch(`/business/places/${placeId}`, { method: 'PATCH', body: data });
}

export function getBusinessPlaceStats(placeId: string): Promise<PlaceStats> {
  return apiFetch(`/business/places/${placeId}/stats`);
}
