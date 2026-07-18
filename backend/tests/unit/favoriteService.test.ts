import { favoritesQuerySchema, favoriteBodySchema } from '../../src/services/favoriteService';

describe('favoritesQuerySchema', () => {
  it('valida lat/lng obrigatórios', () => {
    expect(favoritesQuerySchema.safeParse({ lat: '-23.5505', lng: '-46.6333' }).success).toBe(
      true,
    );
  });

  it('rejeita sem lat/lng', () => {
    expect(favoritesQuerySchema.safeParse({}).success).toBe(false);
  });

  it('rejeita lat fora do intervalo', () => {
    expect(favoritesQuerySchema.safeParse({ lat: '999', lng: '0' }).success).toBe(false);
  });
});

describe('favoriteBodySchema', () => {
  it('valida placeId obrigatório', () => {
    expect(favoriteBodySchema.safeParse({ placeId: 'place-1' }).success).toBe(true);
  });

  it('rejeita sem placeId', () => {
    expect(favoriteBodySchema.safeParse({}).success).toBe(false);
  });

  it('rejeita placeId vazio', () => {
    expect(favoriteBodySchema.safeParse({ placeId: '' }).success).toBe(false);
  });
});
