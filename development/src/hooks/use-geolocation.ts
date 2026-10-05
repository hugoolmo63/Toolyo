"use client";

import { useState, useCallback } from "react";
import {
  getNativeCoordinates,
  GeolocationPermissionError,
} from "@/lib/native/geolocation";
import { isNativeShell } from "@/lib/native/platform";

/**
 * Hook para detectar la ubicación del usuario.
 * En el shell nativo usa el plugin de Capacitor; en web, navigator.geolocation.
 * Respeta la decisión del usuario: no geolocaliza sin consentimiento explícito.
 * Ver spec.md FR-003 y FR-008.
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

  const detect = useCallback(async () => {
    setState({ loading: true, error: null, location: null });

    if (isNativeShell()) {
      try {
        const location = await getNativeCoordinates();
        setState({ loading: false, error: null, location });
      } catch (err) {
        const message =
          err instanceof GeolocationPermissionError
            ? err.message
            : "No se pudo obtener tu ubicación. Puedes seleccionar una ubicación manualmente.";
        setState({ loading: false, error: message, location: null });
      }
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ loading: false, error: "Geolocalización no disponible en este dispositivo.", location: null });
      return;
    }

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
