'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { addFavorite, listFavorites, removeFavorite } from '@/lib/api/endpoints';
import type { Place } from '@/lib/types';

type FavoritesStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface FavoritesContextValue {
  status: FavoritesStatus;
  places: Place[];
  errorMessage: string | null;
  isFavorite: (placeId: string) => boolean;
  load: (lat: number, lng: number) => Promise<void>;
  toggle: (placeId: string) => Promise<void>;
  reset: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/** Favoritar é uma feature gratuita — só exige login, não assinatura. */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<FavoritesStatus>('idle');
  const [places, setPlaces] = useState<Place[]>([]);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFavorite = useCallback(
    (placeId: string) => favoritedIds.has(placeId),
    [favoritedIds],
  );

  const load = useCallback(async (lat: number, lng: number) => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const result = await listFavorites(lat, lng);
      setPlaces(result.data);
      setFavoritedIds(new Set(result.data.map((p) => p.id)));
      setStatus('loaded');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Algo deu errado.');
      setStatus('error');
    }
  }, []);

  // Alterna o favorito com atualização otimista — desfaz se a chamada falhar.
  const toggle = useCallback(
    async (placeId: string) => {
      const wasFavorite = favoritedIds.has(placeId);
      setFavoritedIds((current) => {
        const next = new Set(current);
        if (wasFavorite) next.delete(placeId);
        else next.add(placeId);
        return next;
      });

      try {
        if (wasFavorite) {
          await removeFavorite(placeId);
          setPlaces((current) => current.filter((p) => p.id !== placeId));
        } else {
          await addFavorite(placeId);
        }
      } catch (err) {
        setFavoritedIds((current) => {
          const next = new Set(current);
          if (wasFavorite) next.add(placeId);
          else next.delete(placeId);
          return next;
        });
        setErrorMessage(err instanceof Error ? err.message : 'Algo deu errado.');
      }
    },
    [favoritedIds],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setPlaces([]);
    setFavoritedIds(new Set());
  }, []);

  return (
    <FavoritesContext.Provider
      value={{ status, places, errorMessage, isFavorite, load, toggle, reset }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
