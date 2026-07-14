import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { env } from '../config/env';
import type { NlSearchResult, SearchFilters } from '../types/place';

const MODEL = 'claude-opus-4-8';

export const nlSearchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export type NlSearchQuery = z.infer<typeof nlSearchQuerySchema>;

const extractFiltersTool: Anthropic.Tool = {
  name: 'extract_filters',
  description:
    'Registra os filtros estruturados extraídos da pergunta em linguagem natural do usuário.',
  input_schema: {
    type: 'object',
    properties: {
      categorySlug: {
        type: 'string',
        description: 'Slug da categoria mencionada (ex: "restaurante"), ou omitido se nenhuma categoria específica foi pedida.',
      },
      radiusMeters: {
        type: 'integer',
        description: 'Raio de busca em metros, inferido da pergunta (ex: "perto" ~2000, "na região" ~5000). Nunca menor que 2000, pois a localização do usuário tem imprecisão. Default 5000 se não houver pista.',
      },
      openNow: {
        type: 'boolean',
        description: 'true se o usuário quer apenas lugares abertos agora.',
      },
      acceptsPets: {
        type: 'boolean',
        description: 'true se o usuário quer lugares que aceitam pets.',
      },
    },
    required: [],
  },
};

async function traditionalFallback(
  query: NlSearchQuery,
  reason: string,
): Promise<NlSearchResult> {
  const { searchPlaces } = await import('../repositories/placeRepository');
  const results = await searchPlaces({ lat: query.lat, lng: query.lng });
  return {
    answer: `${reason} Aqui estão os resultados da busca tradicional na sua região.`,
    usedAi: false,
    results,
  };
}

export async function nlSearchService(query: NlSearchQuery): Promise<NlSearchResult> {
  if (!env.ANTHROPIC_API_KEY) {
    return traditionalFallback(query, 'Busca por IA indisponível no momento (chave não configurada).');
  }

  // Qualquer falha na IA (erro de rede, resposta inesperada, timeout) não deve
  // derrubar a busca — cai para o fluxo tradicional em vez de propagar 500.
  try {
    const { searchPlaces } = await import('../repositories/placeRepository');
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const { prisma } = await import('../db/prisma');
    const categories = await prisma.category.findMany({ select: { slug: true, label: true } });
    const categoryList = categories.map((c) => `${c.slug} (${c.label})`).join(', ');

    const extraction = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: `Você extrai filtros estruturados de buscas em linguagem natural para um app de busca de estabelecimentos.
Categorias disponíveis: ${categoryList}.
Use a ferramenta extract_filters para registrar os filtros. Nunca invente uma categoria fora da lista.`,
      tools: [extractFiltersTool],
      tool_choice: { type: 'tool', name: 'extract_filters' },
      messages: [{ role: 'user', content: query.query }],
    });

    const toolUse = extraction.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );

    const extracted = (toolUse?.input ?? {}) as {
      categorySlug?: string;
      radiusMeters?: number;
      openNow?: boolean;
      acceptsPets?: boolean;
    };

    const validCategory = categories.some((c) => c.slug === extracted.categorySlug)
      ? extracted.categorySlug
      : undefined;

    // Piso mínimo de raio: localização real (GPS/rede) tem imprecisão de
    // centenas de metros, então um raio muito curto exclui lugares que o
    // usuário razoavelmente consideraria "perto".
    const MIN_RADIUS_METERS = 2000;
    const radiusMeters = extracted.radiusMeters
      ? Math.max(extracted.radiusMeters, MIN_RADIUS_METERS)
      : undefined;

    const filters: SearchFilters = {
      lat: query.lat,
      lng: query.lng,
      query: query.query,
      categorySlug: validCategory,
      radiusMeters,
      openNow: extracted.openNow,
      acceptsPets: extracted.acceptsPets,
    };

    const results = await searchPlaces(filters);

    const composition = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: `Você é um assistente de busca de estabelecimentos. Responda em português, de forma breve e natural, com base
EXCLUSIVAMENTE nos dados fornecidos em JSON. Nunca invente estabelecimentos, endereços ou informações que não estejam no JSON.
Se a lista estiver vazia, diga que não encontrou nada com esses critérios.`,
      messages: [
        {
          role: 'user',
          content: `Pergunta do usuário: "${query.query}"\n\nResultados encontrados (JSON):\n${JSON.stringify(results.data)}`,
        },
      ],
    });

    const answerBlock = composition.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );

    return {
      answer: answerBlock?.text ?? 'Encontrei alguns resultados para a sua busca.',
      usedAi: true,
      results,
    };
  } catch (err) {
    console.error('[nlSearchService] Falha na IA, caindo para busca tradicional:', (err as Error).message);
    return traditionalFallback(query, 'Não consegui interpretar sua busca com IA no momento.');
  }
}
