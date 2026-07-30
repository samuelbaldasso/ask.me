'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { FilterBar, RADIUS_STEPS_METERS } from '@/components/filter-bar';
import { PlaceCard } from '@/components/place-card';
import { ApiError } from '@/lib/api/client';
import { geocode, searchPlaces } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth/auth-context';
import { useFavorites } from '@/lib/favorites/favorites-context';
import { usePlaceCache } from '@/lib/place-cache';
import { defaultSearchFilters, distanceLabel, type Place, type SearchFilters } from '@/lib/types';
import { type Coordinates, useGeolocation } from '@/lib/use-geolocation';

type ResultsStatus = 'loading' | 'loaded' | 'empty' | 'error';

export default function Home() {
  const geo = useGeolocation();
  const placeCache = usePlaceCache();
  const { isAuthenticated } = useAuth();
  const favorites = useFavorites();
  const router = useRouter();

  const [manualCoords, setManualCoords] = useState<Coordinates | null>(null);
  const [manualLocationLabel, setManualLocationLabel] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  const [filters, setFilters] = useState<SearchFilters | null>(null);
  const [results, setResults] = useState<Place[]>([]);
  const [resultsStatus, setResultsStatus] = useState<ResultsStatus>('loading');
  const [resultsError, setResultsError] = useState<string | null>(null);

  // Marca como visitado ao chegar aqui direto (link compartilhado, atalho
  // salvo) — a landing page ("/") não mostra a apresentação de novo depois.
  useEffect(() => {
    localStorage.setItem('askme_visited', 'true');
  }, []);

  const coords = manualCoords ?? geo.coords;

  useEffect(() => {
    if (coords) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilters((current) =>
        current
          ? { ...current, lat: coords.lat, lng: coords.lng, offset: 0 }
          : defaultSearchFilters(coords.lat, coords.lng),
      );
      if (isAuthenticated) favorites.load(coords.lat, coords.lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, isAuthenticated]);

  const toggleFavorite = (placeId: string) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    favorites.toggle(placeId);
  };

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

  const handleManualLocation = (result: { lat: number; lng: number; formattedAddress: string }) => {
    setManualCoords({ lat: result.lat, lng: result.lng });
    setManualLocationLabel(result.formattedAddress);
    setShowManualForm(false);
  };

  // Sem coordenadas ainda (GPS carregando/negado e nenhum endereço manual
  // informado): oferece as duas opções lado a lado, em vez de travar o
  // usuário esperando o navegador ou negando a permissão.
  if (!coords) {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <div>
          <span className="w-fit rounded-full bg-surface-dim px-3 py-1 text-xs font-semibold text-primary">
            Busca tradicional
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Onde você está?
          </h1>
        </div>

        {geo.status === 'loading' && (
          <p className="text-sm text-[#171123]/60">Tentando obter sua localização por GPS...</p>
        )}
        {geo.status === 'error' && (
          <p className="max-w-sm text-sm text-[#171123]/60">
            {geo.errorMessage} Você também pode digitar um endereço abaixo.
          </p>
        )}

        <div className="flex w-full max-w-sm flex-col gap-3">
          {geo.status === 'error' && (
            <button
              type="button"
              onClick={geo.retry}
              className="rounded-2xl border-2 border-primary px-6 py-3 font-bold text-primary transition hover:bg-primary/5"
            >
              Tentar GPS de novo
            </button>
          )}
          <ManualLocationForm onLocated={handleManualLocation} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="w-fit rounded-full bg-surface-dim px-3 py-1 text-xs font-semibold text-primary">
          Busca tradicional
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
          O que você procura perto de você?
        </h1>
        <button
          type="button"
          onClick={() => setShowManualForm((open) => !open)}
          className="mt-1 text-sm font-semibold text-primary transition hover:opacity-70"
        >
          📍 {manualLocationLabel ?? 'Localização atual (GPS)'} · trocar
        </button>
        {showManualForm && (
          <div className="mt-3 max-w-sm">
            <ManualLocationForm onLocated={handleManualLocation} />
          </div>
        )}
      </div>

      {filters && (
        <FilterBar
          filters={filters}
          onCategoryChange={(slug) => updateFilters({ categorySlug: slug ?? undefined })}
          onToggleOpenNow={(value) => updateFilters({ openNow: value })}
          onToggleAcceptsPets={(value) => updateFilters({ acceptsPets: value })}
          onRadiusChange={(radiusMeters) => updateFilters({ radiusMeters })}
        />
      )}

      {resultsStatus === 'loading' && <StatusMessage text="Buscando lugares..." />}

      {resultsStatus === 'error' && (
        <StatusMessage
          text={resultsError ?? 'Algo deu errado.'}
          onRetry={() => filters && runSearch(filters)}
        />
      )}

      {resultsStatus === 'empty' && filters && (
        <StatusMessage
          text="Nenhum lugar encontrado com esses filtros."
          onRetry={
            nextRadiusStep(filters.radiusMeters)
              ? () => updateFilters({ radiusMeters: nextRadiusStep(filters.radiusMeters)! })
              : undefined
          }
          retryLabel={
            nextRadiusStep(filters.radiusMeters)
              ? `Ampliar para ${distanceLabel(nextRadiusStep(filters.radiusMeters)!)}`
              : undefined
          }
        />
      )}

      {resultsStatus === 'loaded' && (
        <div className="flex flex-col gap-3">
          {results.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              isFavorite={favorites.isFavorite(place.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function nextRadiusStep(currentMeters: number): number | undefined {
  return RADIUS_STEPS_METERS.find((m) => m > currentMeters);
}

/** Formulário de busca manual — alternativa ao GPS via geocodificação (backend /geocode). */
function ManualLocationForm({
  onLocated,
}: {
  onLocated: (result: { lat: number; lng: number; formattedAddress: string }) => void;
}) {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = address.trim();
    if (trimmed.length < 3 || status === 'loading') return;

    setStatus('loading');
    try {
      const result = await geocode(trimmed);
      onLocated(result);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Digite um bairro, cidade ou endereço"
          disabled={status === 'loading'}
          className="min-w-0 flex-1 rounded-full bg-surface-dim px-4 py-2.5 text-sm outline-none ring-primary/40 transition focus:ring-2 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading' || address.trim().length < 3}
          className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {status === 'loading' ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-left text-xs font-semibold text-[#EF4444]">
          Não encontramos esse endereço. Tente ser mais específico (ex: cidade + estado).
        </p>
      )}
    </form>
  );
}

function StatusMessage({
  text,
  onRetry,
  retryLabel = 'Tentar novamente',
}: {
  text: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/60 py-16 text-center text-[#171123]/70">
      <p className="max-w-sm px-4">{text}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-2xl bg-primary px-6 py-3 font-bold text-white transition hover:opacity-90"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
