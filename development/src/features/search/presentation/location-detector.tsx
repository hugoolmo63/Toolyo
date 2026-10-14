"use client";

import { useGeolocation } from "@/hooks/use-geolocation";
import { useUpdateSearchParams } from "@/hooks/use-search-params";

/**
 * LocationDetector — botón "Usar mi ubicación" que usa GPS del navegador.
 * Pide permiso explícito y respeta la decisión del usuario.
 * Ver spec.md FR-003.
 */
export function LocationDetector() {
  const { loading, error, location, detect } = useGeolocation();
  const updateParams = useUpdateSearchParams();

  const handleDetect = () => {
    detect();
  };

  // Cuando se obtiene la ubicación, actualizar la URL
  if (location) {
    updateParams({
      lat: location.lat,
      lng: location.lng,
      locationText: "Mi ubicación",
      radius: 50,
      page: null,
    });
  }

  return (
    <div className="location-detector">
      <button
        type="button"
        onClick={handleDetect}
        disabled={loading}
        className="location-detect-btn"
        aria-label="Usar mi ubicación actual"
      >
        {loading ? "Detectando..." : "📍 Usar mi ubicación"}
      </button>
      {error && (
        <p className="location-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
