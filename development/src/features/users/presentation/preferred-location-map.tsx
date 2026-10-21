"use client";

import { useEffect, useRef, useState } from "react";
import { formatPreferredLocation, parsePreferredLocation, type PreferredCoordinates } from "../domain/preferred-location";

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_CENTER: PreferredCoordinates = { lat: 40.4168, lng: -3.7038 };
const APPROXIMATE_RADIUS_METERS = 750;

type LeafletModule = typeof import("leaflet");

function loadLeafletCss() {
  if (typeof document === "undefined" || document.querySelector("link[data-toolyo-leaflet]") !== null) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  link.dataset.toolyoLeaflet = "true";
  document.head.appendChild(link);
}

export function PreferredLocationMap({
  value,
  onChange,
  readOnly = false,
}: {
  value: string | null | undefined;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<LeafletModule["map"]> | null>(null);
  const layerRef = useRef<ReturnType<LeafletModule["circle"]> | null>(null);
  const markerRef = useRef<ReturnType<LeafletModule["marker"]> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const coordinates = parsePreferredLocation(value) ?? DEFAULT_CENTER;

  useEffect(() => {
    let mounted = true;
    loadLeafletCss();
    void import("leaflet").then((leaflet) => {
      if (!mounted || !containerRef.current || mapRef.current) return;
      const L = leaflet.default;
      const map = L.map(containerRef.current).setView([coordinates.lat, coordinates.lng], value ? 12 : 5);
      L.tileLayer(TILE_URL, { attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
      mapRef.current = map;

      const updateLocation = (lat: number, lng: number) => {
        const next = { lat, lng };
        layerRef.current?.setLatLng([lat, lng]);
        markerRef.current?.setLatLng([lat, lng]);
        onChange?.(formatPreferredLocation(next));
      };

      layerRef.current = L.circle([coordinates.lat, coordinates.lng], {
        radius: APPROXIMATE_RADIUS_METERS,
        color: "#2563eb",
        fillColor: "#60a5fa",
        fillOpacity: 0.2,
      }).addTo(map);

      if (!readOnly) {
        markerRef.current = L.marker([coordinates.lat, coordinates.lng], { draggable: true }).addTo(map);
        markerRef.current.on("dragend", () => {
          const position = markerRef.current?.getLatLng();
          if (position) updateLocation(position.lat, position.lng);
        });
        map.on("click", (event) => updateLocation(event.latlng.lat, event.latlng.lng));
      }
    }).catch(() => mounted && setLoadError(true));

    return () => {
      mounted = false;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      markerRef.current = null;
    };
  }, [coordinates.lat, coordinates.lng, onChange, readOnly, value]);

  if (loadError) return <p className="form-error">No se pudo cargar el mapa.</p>;
  return (
    <div>
      <div ref={containerRef} className="preferred-location-map" aria-label="Mapa de ubicación preferida" />
      <p className="preferred-location-hint">
        {readOnly ? "Zona aproximada." : "Haz clic en el mapa o arrastra el pin para elegir una zona aproximada."}
      </p>
    </div>
  );
}