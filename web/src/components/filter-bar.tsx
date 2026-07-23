'use client';

import { AVAILABLE_CATEGORIES, categoryStyleForSlug } from '@/lib/category-style';
import type { SearchFilters } from '@/lib/types';

interface FilterBarProps {
  filters: SearchFilters;
  onCategoryChange: (slug: string | null) => void;
  onToggleOpenNow: (value: boolean) => void;
  onToggleAcceptsPets: (value: boolean) => void;
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
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
        selected
          ? 'bg-primary text-white'
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
}: FilterBarProps) {
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
    </div>
  );
}
