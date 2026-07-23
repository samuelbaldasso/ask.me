export interface CategoryStyle {
  emoji: string;
  color: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  restaurante: { emoji: '🍽️', color: '#FF6B6B' },
  bar: { emoji: '🍸', color: '#F97316' },
  farmacia: { emoji: '💊', color: '#10B981' },
  'pet-shop': { emoji: '🐾', color: '#3B82F6' },
  mercado: { emoji: '🛒', color: '#FFB020' },
  cafe: { emoji: '☕', color: '#8B5E3C' },
};

const DEFAULT_STYLE: CategoryStyle = { emoji: '📍', color: '#7C3AED' };

export function categoryStyleForSlug(slug: string): CategoryStyle {
  return CATEGORY_STYLES[slug] ?? DEFAULT_STYLE;
}

/** Categorias oferecidas no filtro de busca (o backend não expõe um endpoint de listagem). */
export const AVAILABLE_CATEGORIES = [
  { slug: 'restaurante', label: 'Restaurante' },
  { slug: 'bar', label: 'Bar' },
  { slug: 'cafe', label: 'Café' },
  { slug: 'mercado', label: 'Mercado' },
  { slug: 'farmacia', label: 'Farmácia' },
];
