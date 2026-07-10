import { searchQuerySchema } from '../../src/services/placeService';

describe('searchQuerySchema', () => {
  const validBase = { lat: '-23.5505', lng: '-46.6333' };

  it('valida parâmetros mínimos obrigatórios', () => {
    const result = searchQuerySchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('rejeita sem lat/lng', () => {
    expect(searchQuerySchema.safeParse({}).success).toBe(false);
    expect(searchQuerySchema.safeParse({ lat: '-23.5' }).success).toBe(false);
  });

  it('rejeita lat fora do intervalo', () => {
    const result = searchQuerySchema.safeParse({ lat: '95', lng: '0' });
    expect(result.success).toBe(false);
  });

  it('rejeita radius > 50000', () => {
    const result = searchQuerySchema.safeParse({ ...validBase, radius: '60000' });
    expect(result.success).toBe(false);
  });

  it('converte openNow string para boolean', () => {
    const result = searchQuerySchema.safeParse({ ...validBase, openNow: 'true' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.openNow).toBe(true);
  });

  it('openNow é false quando não enviado', () => {
    const result = searchQuerySchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.openNow).toBe(false);
  });
});
