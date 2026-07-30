import { apiFetch } from './client';
import type {
  AskResult,
  PaginatedResult,
  Place,
  SearchFilters,
  SubscriptionStatus,
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
): Promise<{ token: string; user: AppUser }> {
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
