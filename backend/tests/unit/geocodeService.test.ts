import { geocodeService, geocodeQuerySchema } from '../../src/services/geocodeService';
import { env } from '../../src/config/env';

describe('geocodeQuerySchema', () => {
  it('rejeita endereço vazio ou muito curto', () => {
    expect(geocodeQuerySchema.safeParse({ address: '' }).success).toBe(false);
    expect(geocodeQuerySchema.safeParse({ address: 'ab' }).success).toBe(false);
  });

  it('aceita endereço válido', () => {
    const result = geocodeQuerySchema.safeParse({ address: 'Fortaleza, CE' });
    expect(result.success).toBe(true);
  });
});

describe('geocodeService', () => {
  it('retorna null sem lançar quando GOOGLE_PLACES_API_KEY não está configurada', async () => {
    const original = env.GOOGLE_PLACES_API_KEY;
    (env as { GOOGLE_PLACES_API_KEY?: string }).GOOGLE_PLACES_API_KEY = undefined;

    await expect(geocodeService({ address: 'Fortaleza, CE' })).resolves.toBeNull();

    (env as { GOOGLE_PLACES_API_KEY?: string }).GOOGLE_PLACES_API_KEY = original;
  });

  it('retorna null (fallback) em vez de lançar quando a chamada à API falha', async () => {
    (env as { GOOGLE_PLACES_API_KEY?: string }).GOOGLE_PLACES_API_KEY = 'fake-key-for-test';

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('network error')) as unknown as typeof fetch;

    await expect(geocodeService({ address: 'Fortaleza, CE' })).resolves.toBeNull();

    global.fetch = originalFetch;
    (env as { GOOGLE_PLACES_API_KEY?: string }).GOOGLE_PLACES_API_KEY = undefined;
  });

  it('retorna lat/lng quando a API responde OK', async () => {
    (env as { GOOGLE_PLACES_API_KEY?: string }).GOOGLE_PLACES_API_KEY = 'fake-key-for-test';

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'OK',
        results: [
          {
            formatted_address: 'Fortaleza, CE, Brasil',
            geometry: { location: { lat: -3.7319, lng: -38.5267 } },
          },
        ],
      }),
    }) as unknown as typeof fetch;

    await expect(geocodeService({ address: 'Fortaleza, CE' })).resolves.toEqual({
      lat: -3.7319,
      lng: -38.5267,
      formattedAddress: 'Fortaleza, CE, Brasil',
    });

    global.fetch = originalFetch;
    (env as { GOOGLE_PLACES_API_KEY?: string }).GOOGLE_PLACES_API_KEY = undefined;
  });
});
