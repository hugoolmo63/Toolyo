"use client";

import { useState, useEffect } from "react";
import type { MapPin } from "@/types/search";

/**
 * MapView — mapa interactivo con Leaflet y react-leaflet.
 * Carga Leaflet dinámicamente (sin SSR) y muestra pins con preview al clic.
 * Degradación elegante si Leaflet o los tiles no cargan (FR-017).
 * Ver spec.md FR-010, FR-017 y contracts/search.md (search.mapBounds).
 */

// URL de tiles del mapa — usa NEXT_PUBLIC_ para que esté disponible en el cliente
const MAP_TILES_URL =
  process.env.NEXT_PUBLIC_MAP_TILES_URL ??
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

// Cargar CSS de Leaflet una sola vez
let leafletCssLoaded = false;
function loadLeafletCss() {
  if (leafletCssLoaded || typeof document === "undefined") return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
  leafletCssLoaded = true;
}

// Fix iconos de Leaflet — usar URLs correctas con la barra inclinada
function fixLeafletIcons(L: any) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

export function MapView({
  center,
  pins,
  isLoading,
}: {
  center: { lat: number; lng: number } | null;
  pins: MapPin[];
  isLoading: boolean;
}) {
  const [mods, setMods] = useState<{
    MapContainer: React.ComponentType<any>;
    TileLayer: React.ComponentType<any>;
    Marker: React.ComponentType<any>;
  } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);

  // Cargar Leaflet + react-leaflet dinámicamente (sin SSR)
  useEffect(() => {
    let mounted = true;
    loadLeafletCss();

    Promise.all([import("react-leaflet"), import("leaflet")])
      .then(([reactLeaflet, leaflet]) => {
        if (!mounted) return;
        fixLeafletIcons(leaflet.default);
        setMods({
          MapContainer: reactLeaflet.MapContainer,
          TileLayer: reactLeaflet.TileLayer,
          Marker: reactLeaflet.Marker,
        });
      })
      .catch(() => {
        if (mounted) setLoadError(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loadError) {
    return (
      <div className="map-fallback" role="alert">
        <p>Mapa no disponible temporalmente</p>
        <p className="map-fallback-hint">Puedes seguir usando la vista de lista.</p>
      </div>
    );
  }

  if (!mods) {
    return (
      <div className="map-loading" aria-busy="true">
        <p>Cargando mapa...</p>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker } = mods;

  // Default center: Madrid si no hay ubicación
  const mapCenter: [number, number] = center
    ? [center.lat, center.lng]
    : [40.4168, -3.7038];

  return (
    <div className="map-view">
      <MapContainer
        center={mapCenter}
        zoom={12}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          url={MAP_TILES_URL}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            eventHandlers={{
              click: () => setSelectedPin(pin),
            }}
          />
        ))}
      </MapContainer>

      {selectedPin && (
        <div className="map-preview" role="dialog" aria-label="Vista previa del listing">
          <button
            className="map-preview-close"
            onClick={() => setSelectedPin(null)}
            aria-label="Cerrar vista previa"
          >
            ✕
          </button>
          {selectedPin.primaryPhotoUrl && (
            <img
              src={selectedPin.primaryPhotoUrl}
              alt={selectedPin.title}
              className="map-preview-image"
            />
          )}
          <div className="map-preview-body">
            <h3 className="map-preview-title">{selectedPin.title}</h3>
            <div className="map-preview-meta">
              <span className="map-preview-price">
                {selectedPin.pricePerDay} €/día
              </span>
              <span className="map-preview-rating">
                ★ {selectedPin.ratingAverage.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {isLoading && <div className="map-overlay-loading">Cargando pins...</div>}
    </div>
  );
}
