import { z } from 'zod';
import { geocodeAddress, type GeocodeResult } from './mapsService';

export const geocodeQuerySchema = z.object({
  address: z.string().trim().min(3).max(200),
});

export type GeocodeQuery = z.infer<typeof geocodeQuerySchema>;

export async function geocodeService(query: GeocodeQuery): Promise<GeocodeResult | null> {
  return geocodeAddress(query.address);
}
