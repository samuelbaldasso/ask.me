'use client';

import { useCallback, useEffect, useState } from 'react';

export interface Coordinates {
  lat: number;
  lng: number;
}

type GeoStatus = 'loading' | 'ready' | 'error';

interface GeolocationState {
  status: GeoStatus;
  coords: Coordinates | null;
  errorMessage: string | null;
  retry: () => void;
}

function messageForError(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Permissão de localização negada. Habilite nas configurações do navegador.';
    case error.POSITION_UNAVAILABLE:
      return 'Não foi possível obter sua localização.';
    case error.TIMEOUT:
      return 'Tempo esgotado ao obter sua localização.';
    default:
      return 'Não foi possível obter sua localização.';
  }
}

/** Equivalente web do LocationService (geolocator) do app Flutter. */
export function useGeolocation(): GeolocationState {
  const [status, setStatus] = useState<GeoStatus>('loading');
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('error');
      setErrorMessage('Seu navegador não suporta geolocalização.');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setStatus('ready');
      },
      (error) => {
        setStatus('error');
        setErrorMessage(messageForError(error));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return { status, coords, errorMessage, retry };
}
