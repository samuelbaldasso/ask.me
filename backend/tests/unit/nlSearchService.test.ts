import { nlSearchQuerySchema } from '../../src/services/nlSearchService';

jest.mock('../../src/config/env', () => ({
  env: { ANTHROPIC_API_KEY: undefined as string | undefined },
}));

jest.mock('../../src/repositories/placeRepository', () => ({
  searchPlaces: jest.fn(),
}));

jest.mock('../../src/db/prisma', () => ({
  prisma: {
    category: { findMany: jest.fn() },
  },
}));

const mockCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  }));
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { env } = require('../../src/config/env');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { searchPlaces } = require('../../src/repositories/placeRepository');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require('../../src/db/prisma');

import { nlSearchService } from '../../src/services/nlSearchService';

const emptyResults = { data: [], total: 0, limit: 20, offset: 0 };

describe('nlSearchQuerySchema', () => {
  it('valida query, lat e lng obrigatórios', () => {
    const result = nlSearchQuerySchema.safeParse({
      query: 'sushi aberto agora',
      lat: '-23.5505',
      lng: '-46.6333',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita sem query', () => {
    const result = nlSearchQuerySchema.safeParse({ lat: '-23.5505', lng: '-46.6333' });
    expect(result.success).toBe(false);
  });

  it('rejeita query vazia', () => {
    const result = nlSearchQuerySchema.safeParse({ query: '', lat: '-23.5505', lng: '-46.6333' });
    expect(result.success).toBe(false);
  });

  it('rejeita lat/lng fora do intervalo', () => {
    const result = nlSearchQuerySchema.safeParse({ query: 'sushi', lat: '999', lng: '-46.6333' });
    expect(result.success).toBe(false);
  });
});

describe('nlSearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    env.ANTHROPIC_API_KEY = undefined;
  });

  it('cai para busca tradicional quando ANTHROPIC_API_KEY não está configurada', async () => {
    searchPlaces.mockResolvedValue(emptyResults);

    const result = await nlSearchService({
      query: 'sushi aberto agora',
      lat: -23.5505,
      lng: -46.6333,
    });

    expect(result.usedAi).toBe(false);
    expect(result.results).toBe(emptyResults);
    expect(searchPlaces).toHaveBeenCalledWith({ lat: -23.5505, lng: -46.6333 });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('extrai filtros via IA, busca e compõe resposta natural quando a chave está configurada', async () => {
    env.ANTHROPIC_API_KEY = 'test-key';
    prisma.category.findMany.mockResolvedValue([
      { slug: 'restaurante', label: 'Restaurante' },
      { slug: 'pet-shop', label: 'Pet Shop' },
    ]);
    searchPlaces.mockResolvedValue(emptyResults);
    mockCreate
      .mockResolvedValueOnce({
        content: [
          {
            type: 'tool_use',
            id: 'toolu_1',
            name: 'extract_filters',
            input: { categorySlug: 'restaurante', openNow: true },
          },
        ],
      })
      .mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Não encontrei nenhum restaurante aberto agora perto de você.' }],
      });

    const result = await nlSearchService({
      query: 'restaurante aberto agora perto de mim',
      lat: -23.5505,
      lng: -46.6333,
    });

    expect(result.usedAi).toBe(true);
    expect(result.answer).toBe('Não encontrei nenhum restaurante aberto agora perto de você.');
    expect(searchPlaces).toHaveBeenCalledWith(
      expect.objectContaining({
        lat: -23.5505,
        lng: -46.6333,
        categorySlug: 'restaurante',
        openNow: true,
      }),
    );
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('descarta categoria inventada pela IA que não existe no banco', async () => {
    env.ANTHROPIC_API_KEY = 'test-key';
    prisma.category.findMany.mockResolvedValue([{ slug: 'restaurante', label: 'Restaurante' }]);
    searchPlaces.mockResolvedValue(emptyResults);
    mockCreate
      .mockResolvedValueOnce({
        content: [
          {
            type: 'tool_use',
            id: 'toolu_1',
            name: 'extract_filters',
            input: { categorySlug: 'categoria-inexistente' },
          },
        ],
      })
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'Sem resultados.' }] });

    await nlSearchService({ query: 'algo bem específico', lat: -23.5505, lng: -46.6333 });

    expect(searchPlaces).toHaveBeenCalledWith(
      expect.objectContaining({ categorySlug: undefined }),
    );
  });

  it('nunca inventa dados: a resposta é composta apenas com os resultados retornados do banco', async () => {
    env.ANTHROPIC_API_KEY = 'test-key';
    prisma.category.findMany.mockResolvedValue([]);
    const places = {
      data: [
        {
          id: '1',
          name: 'Sushi Sakura',
          description: null,
          address: 'Rua Augusta, 1200',
          city: 'São Paulo',
          lat: -23.55,
          lng: -46.65,
          distanceMeters: 500,
          category: { slug: 'restaurante', label: 'Restaurante' },
          acceptsPets: true,
          acceptsCards: true,
          hasParking: false,
          phone: null,
          website: null,
          isOpenNow: true,
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    };
    searchPlaces.mockResolvedValue(places);
    mockCreate
      .mockResolvedValueOnce({ content: [{ type: 'tool_use', id: 'toolu_1', name: 'extract_filters', input: {} }] })
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'Encontrei o Sushi Sakura pertinho de você.' }] });

    const result = await nlSearchService({ query: 'sushi', lat: -23.55, lng: -46.65 });

    const compositionCall = mockCreate.mock.calls[1][0];
    expect(compositionCall.messages[0].content).toContain('Sushi Sakura');
    expect(compositionCall.system).toMatch(/EXCLUSIVAMENTE/);
    expect(result.results).toBe(places);
  });

  it('combina múltiplos filtros extraídos de uma pergunta complexa', async () => {
    env.ANTHROPIC_API_KEY = 'test-key';
    prisma.category.findMany.mockResolvedValue([
      { slug: 'restaurante', label: 'Restaurante' },
      { slug: 'pet-shop', label: 'Pet Shop' },
    ]);
    searchPlaces.mockResolvedValue(emptyResults);
    mockCreate
      .mockResolvedValueOnce({
        content: [
          {
            type: 'tool_use',
            id: 'toolu_1',
            name: 'extract_filters',
            input: {
              categorySlug: 'restaurante',
              radiusMeters: 1000,
              openNow: true,
              acceptsPets: true,
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Não encontrei sushi aberto agora que aceite pets perto de você.' }],
      });

    await nlSearchService({
      query: 'onde tem sushi aberto agora perto de mim e que aceite pet',
      lat: -23.5505,
      lng: -46.6333,
    });

    expect(searchPlaces).toHaveBeenCalledWith(
      expect.objectContaining({
        categorySlug: 'restaurante',
        radiusMeters: 1000,
        openNow: true,
        acceptsPets: true,
      }),
    );
  });

  it('cai para busca tradicional quando a chamada de extração à IA falha', async () => {
    env.ANTHROPIC_API_KEY = 'test-key';
    prisma.category.findMany.mockResolvedValue([{ slug: 'restaurante', label: 'Restaurante' }]);
    searchPlaces.mockResolvedValue(emptyResults);
    mockCreate.mockRejectedValueOnce(new Error('network error'));

    const result = await nlSearchService({
      query: 'sushi aberto agora',
      lat: -23.5505,
      lng: -46.6333,
    });

    expect(result.usedAi).toBe(false);
    expect(result.answer).toMatch(/Não consegui interpretar/);
    // Fallback busca de forma ampla (sem os filtros que a IA não conseguiu extrair)
    expect(searchPlaces).toHaveBeenCalledWith({ lat: -23.5505, lng: -46.6333 });
  });

  it('cai para busca tradicional quando a chamada de composição da resposta falha', async () => {
    env.ANTHROPIC_API_KEY = 'test-key';
    prisma.category.findMany.mockResolvedValue([{ slug: 'restaurante', label: 'Restaurante' }]);
    searchPlaces.mockResolvedValue(emptyResults);
    mockCreate
      .mockResolvedValueOnce({
        content: [{ type: 'tool_use', id: 'toolu_1', name: 'extract_filters', input: { categorySlug: 'restaurante' } }],
      })
      .mockRejectedValueOnce(new Error('timeout'));

    const result = await nlSearchService({
      query: 'restaurante',
      lat: -23.5505,
      lng: -46.6333,
    });

    expect(result.usedAi).toBe(false);
    expect(result.answer).toMatch(/Não consegui interpretar/);
  });
});
