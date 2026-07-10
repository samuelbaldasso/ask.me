import { enrichPlaceFromGoogle } from '../../src/services/mapsService';
import { env } from '../../src/config/env';

describe('enrichPlaceFromGoogle', () => {
  it('retorna null sem lançar quando GOOGLE_PLACES_API_KEY não está configurada', async () => {
    const original = env.GOOGLE_PLACES_API_KEY;
    (env as { GOOGLE_PLACES_API_KEY?: string }).GOOGLE_PLACES_API_KEY = undefined;

    await expect(enrichPlaceFromGoogle('Sushi Sakura', 'São Paulo')).resolves.toBeNull();

    (env as { GOOGLE_PLACES_API_KEY?: string }).GOOGLE_PLACES_API_KEY = original;
  });

  it('retorna null (fallback) em vez de lançar quando a chamada à API falha', async () => {
    (env as { GOOGLE_PLACES_API_KEY?: string }).GOOGLE_PLACES_API_KEY = 'fake-key-for-test';

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('network error')) as unknown as typeof fetch;

    await expect(enrichPlaceFromGoogle('Sushi Sakura', 'São Paulo')).resolves.toBeNull();

    global.fetch = originalFetch;
    (env as { GOOGLE_PLACES_API_KEY?: string }).GOOGLE_PLACES_API_KEY = undefined;
  });
});
