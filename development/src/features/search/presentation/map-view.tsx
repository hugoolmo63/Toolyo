"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { MapPin } from "@/types/search";
import type { LatLngBoundsExpression } from "leaflet";

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

export function getMapPinsWithCoordinates(pins: MapPin[]) {
  return pins.filter((pin) => Number.isFinite(pin.lat) && Number.isFinite(pin.lng));
}

export function getMapListingHref(listingId: string) {
  return `/listings/${listingId}`;
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
    Popup: React.ComponentType<any>;
    FitPins: React.ComponentType<{ pins: MapPin[]; center: [number, number] }>;
  } | null>(null);
  const [loadError, setLoadError] = useState(false);

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
          Popup: reactLeaflet.Popup,
          FitPins: function FitPins({ pins: visiblePins, center: fallbackCenter }) {
            const map = reactLeaflet.useMap();
            useEffect(() => {
              const points = getMapPinsWithCoordinates(visiblePins)
                .map((pin) => [pin.lat, pin.lng] as [number, number]);
              if (points.length === 0) {
                map.setView(fallbackCenter, 12);
              } else if (points.length === 1) {
                map.setView(points[0]!, 14);
              } else {
                map.fitBounds(points as LatLngBoundsExpression, { padding: [32, 32], maxZoom: 14 });
              }
            }, [map, visiblePins, fallbackCenter]);
            return null;
          },
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

  const { MapContainer, TileLayer, Marker, Popup, FitPins } = mods;

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
        <FitPins pins={pins} center={mapCenter} />
        <TileLayer
          url={MAP_TILES_URL}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {getMapPinsWithCoordinates(pins).map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            eventHandlers={{
              click: (event: { target: { openPopup: () => void } }) => event.target.openPopup(),
              mouseover: (event: { target: { openPopup: () => void } }) => event.target.openPopup(),
            }}
          >
            <Popup>
              <Link href={getMapListingHref(pin.id)} className="map-pin-preview" aria-label={`Ver ${pin.title}`}>
                {pin.primaryPhotoUrl && (
                  <Image
                    src={pin.primaryPhotoUrl}
                    alt=""
                    width={240}
                    height={120}
                    unoptimized
                    className="map-pin-preview-image"
                  />
                )}
                <span className="map-pin-preview-title">{pin.title}</span>
                <strong className="map-pin-preview-price">{pin.pricePerDay} €/día</strong>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {isLoading && <div className="map-overlay-loading">Cargando pins...</div>}
    </div>
  );
}
