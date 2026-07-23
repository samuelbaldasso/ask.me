'use client';

import { useCallback, useEffect, useState } from 'react';
import { FilterBar } from '@/components/filter-bar';
import { PlaceCard } from '@/components/place-card';
import { ApiError } from '@/lib/api/client';
import { searchPlaces } from '@/lib/api/endpoints';
import { usePlaceCache } from '@/lib/place-cache';
import { defaultSearchFilters, type Place, type SearchFilters } from '@/lib/types';
import { useGeolocation } from '@/lib/use-geolocation';

type ResultsStatus = 'loading' | 'loaded' | 'empty' | 'error';

export default function Home() {
  const geo = useGeolocation();
  const placeCache = usePlaceCache();

  const [filters, setFilters] = useState<SearchFilters | null>(null);
  const [results, setResults] = useState<Place[]>([]);
  const [resultsStatus, setResultsStatus] = useState<ResultsStatus>('loading');
  const [resultsError, setResultsError] = useState<string | null>(null);

  useEffect(() => {
    if (geo.status === 'ready' && geo.coords) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilters(defaultSearchFilters(geo.coords.lat, geo.coords.lng));
    }
  }, [geo.status, geo.coords]);

  const runSearch = useCallback(
    async (nextFilters: SearchFilters) => {
      setResultsStatus('loading');
      setResultsError(null);
      try {
        const result = await searchPlaces(nextFilters);
        setResults(result.data);
        placeCache.put(result.data);
        setResultsStatus(result.data.length === 0 ? 'empty' : 'loaded');
      } catch (err) {
        setResultsStatus('error');
        setResultsError(
          err instanceof ApiError ? err.message : 'Não foi possível buscar lugares.',
        );
      }
    },
    [placeCache],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (filters) runSearch(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const updateFilters = (patch: Partial<SearchFilters>) => {
    setFilters((current) => (current ? { ...current, ...patch, offset: 0 } : current));
  };

  if (geo.status === 'loading' || (geo.status === 'ready' && !filters)) {
    return <StatusMessage text="Obtendo sua localização..." />;
  }

  if (geo.status === 'error') {
    return (
      <StatusMessage text={geo.errorMessage ?? 'Algo deu errado.'} onRetry={geo.retry} />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="w-fit rounded-full bg-surface-dim px-3 py-1 text-xs font-semibold text-primary">
          Fase 2 — busca tradicional
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
          O que você procura perto de você?
        </h1>
      </div>

      {filters && (
        <FilterBar
          filters={filters}
          onCategoryChange={(slug) => updateFilters({ categorySlug: slug ?? undefined })}
          onToggleOpenNow={(value) => updateFilters({ openNow: value })}
          onToggleAcceptsPets={(value) => updateFilters({ acceptsPets: value })}
        />
      )}

      {resultsStatus === 'loading' && <StatusMessage text="Buscando lugares..." />}

      {resultsStatus === 'error' && (
        <StatusMessage
          text={resultsError ?? 'Algo deu errado.'}
          onRetry={() => filters && runSearch(filters)}
        />
      )}

      {resultsStatus === 'empty' && (
        <StatusMessage text="Nenhum lugar encontrado com esses filtros. Tente ampliar o raio de busca." />
      )}

      {resultsStatus === 'loaded' && (
        <div className="flex flex-col gap-3">
          {results.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusMessage({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-foreground/70">
      <p className="max-w-sm">{text}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-2xl bg-primary px-6 py-3 font-bold text-white"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
