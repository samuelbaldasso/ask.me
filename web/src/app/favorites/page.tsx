'use client';

import { useEffect } from 'react';
import { PlaceCard } from '@/components/place-card';
import { RequireAuth } from '@/lib/auth/require-auth';
import { useFavorites } from '@/lib/favorites/favorites-context';
import { usePlaceCache } from '@/lib/place-cache';
import { useGeolocation } from '@/lib/use-geolocation';

function FavoritesList() {
  const geo = useGeolocation();
  const favorites = useFavorites();
  const placeCache = usePlaceCache();

  useEffect(() => {
    if (geo.status === 'ready' && geo.coords) {
      favorites.load(geo.coords.lat, geo.coords.lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.status, geo.coords]);

  useEffect(() => {
    placeCache.put(favorites.places);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites.places]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Favoritos</h1>

      {geo.status === 'loading' && (
        <p className="py-16 text-center text-foreground/70">
          Obtendo sua localização...
        </p>
      )}

      {geo.status === 'error' && (
        <p className="py-16 text-center text-foreground/70">
          {geo.errorMessage}
        </p>
      )}

      {geo.status === 'ready' && favorites.status === 'loading' && (
        <p className="py-16 text-center text-foreground/70">Carregando...</p>
      )}

      {favorites.status === 'error' && (
        <p className="py-16 text-center text-foreground/70">
          {favorites.errorMessage ?? 'Algo deu errado.'}
        </p>
      )}

      {favorites.status === 'loaded' && favorites.places.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/60 py-16 text-center text-foreground/70">
          <span className="text-4xl" aria-hidden>
            🤍
          </span>
          <p className="max-w-xs px-4">
            Você ainda não favoritou nenhum lugar. Toque no coração de um
            resultado da busca.
          </p>
        </div>
      )}

      {favorites.status === 'loaded' && favorites.places.length > 0 && (
        <div className="flex flex-col gap-3">
          {favorites.places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              isFavorite
              onToggleFavorite={favorites.toggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <RequireAuth>
      <FavoritesList />
    </RequireAuth>
  );
}
