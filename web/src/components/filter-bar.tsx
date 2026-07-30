'use client';

import { AVAILABLE_CATEGORIES, categoryStyleForSlug } from '@/lib/category-style';
import { distanceLabel, type SearchFilters } from '@/lib/types';

// Passos do controle de raio, em metros — alinhados ao intervalo aceito pelo
// backend (100m a 50km, ver searchQuerySchema). Passos discretos em vez de
// slider contínuo: mais fácil de acertar no toque do que arrastar até um
// valor exato em metros.
export const RADIUS_STEPS_METERS = [500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000];

interface FilterBarProps {
  filters: SearchFilters;
  onCategoryChange: (slug: string | null) => void;
  onToggleOpenNow: (value: boolean) => void;
  onToggleAcceptsPets: (value: boolean) => void;
  onRadiusChange: (radiusMeters: number) => void;
}

function Chip({
  label,
  emoji,
  selected,
  onClick,
}: {
  label: string;
  emoji: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2.5 text-sm font-semibold transition active:scale-95 ${
        selected
          ? 'bg-primary text-white shadow-[0_4px_10px_rgba(124,58,237,0.25)]'
          : 'bg-surface-dim text-[#3A2E5C] hover:bg-surface-dim/70'
      }`}
    >
      <span aria-hidden>{emoji}</span>
      {label}
    </button>
  );
}

export function FilterBar({
  filters,
  onCategoryChange,
  onToggleOpenNow,
  onToggleAcceptsPets,
  onRadiusChange,
}: FilterBarProps) {
  const stepIndex = Math.max(
    0,
    RADIUS_STEPS_METERS.findIndex((m) => m >= filters.radiusMeters),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip
          label="Todas"
          emoji="✨"
          selected={!filters.categorySlug}
          onClick={() => onCategoryChange(null)}
        />
        {AVAILABLE_CATEGORIES.map((category) => (
          <Chip
            key={category.slug}
            label={category.label}
            emoji={categoryStyleForSlug(category.slug).emoji}
            selected={filters.categorySlug === category.slug}
            onClick={() => onCategoryChange(category.slug)}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip
          label="Aberto agora"
          emoji="🕒"
          selected={filters.openNow}
          onClick={() => onToggleOpenNow(!filters.openNow)}
        />
        <Chip
          label="Aceita pets"
          emoji="🐾"
          selected={filters.acceptsPets}
          onClick={() => onToggleAcceptsPets(!filters.acceptsPets)}
        />
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-surface-dim px-4 py-3">
        <span className="shrink-0 text-sm font-semibold text-[#3A2E5C]">
          Raio: <span className="text-primary">{distanceLabel(filters.radiusMeters)}</span>
        </span>
        <input
          type="range"
          min={0}
          max={RADIUS_STEPS_METERS.length - 1}
          step={1}
          value={stepIndex}
          onChange={(e) => onRadiusChange(RADIUS_STEPS_METERS[Number(e.target.value)])}
          className="h-2 w-full flex-1 cursor-pointer appearance-none rounded-full bg-white accent-primary"
          aria-label="Raio de busca"
        />
      </div>
    </div>
  );
}
