'use client';

import { createContext, useCallback, useContext, useRef } from 'react';
import type { Place } from './types';

interface PlaceCacheValue {
  put: (places: Place[]) => void;
  get: (id: string) => Place | undefined;
}

const PlaceCacheContext = createContext<PlaceCacheValue | null>(null);

/**
 * Cache em memória dos últimos resultados de busca, usado pela página de
 * detalhe (/places/[id]) — o backend não expõe um endpoint "get place by id",
 * então o Flutter também navega passando o objeto Place já carregado.
 */
export function PlaceCacheProvider({ children }: { children: React.ReactNode }) {
  const cacheRef = useRef(new Map<string, Place>());

  const put = useCallback((places: Place[]) => {
    for (const place of places) cacheRef.current.set(place.id, place);
  }, []);

  const get = useCallback((id: string) => cacheRef.current.get(id), []);

  return (
    <PlaceCacheContext.Provider value={{ put, get }}>
      {children}
    </PlaceCacheContext.Provider>
  );
}

export function usePlaceCache(): PlaceCacheValue {
  const ctx = useContext(PlaceCacheContext);
  if (!ctx) throw new Error('usePlaceCache must be used within PlaceCacheProvider');
  return ctx;
}
