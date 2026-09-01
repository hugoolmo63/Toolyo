"use client";

import { useState, useCallback } from "react";

/**
 * Hook para detectar la ubicación del usuario vía GPS (navigator.geolocation).
 * Respeta la decisión del usuario: no geolocaliza sin consentimiento explícito.
 * Ver spec.md FR-003 y research.md.
 */

interface GeolocationState {
  loading: boolean;
  error: string | null;
  location: { lat: number; lng: number } | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    location: null,
  });

  const detect = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ loading: false, error: "Geolocalización no disponible en este dispositivo.", location: null });
      return;
    }

    setState({ loading: true, error: null, location: null });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          loading: false,
          error: null,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
      },
      (err) => {
        let message = "No se pudo obtener tu ubicación.";
        if (err.code === err.PERMISSION_DENIED) {
          message = "Permiso de ubicación denegado. Puedes seleccionar una ubicación manualmente.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = "Ubicación no disponible. Puedes seleccionar una ubicación manualmente.";
        } else if (err.code === err.TIMEOUT) {
          message = "Tiempo agotado al obtener tu ubicación. Inténtalo de nuevo.";
        }
        setState({ loading: false, error: message, location: null });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  return { ...state, detect };
}
