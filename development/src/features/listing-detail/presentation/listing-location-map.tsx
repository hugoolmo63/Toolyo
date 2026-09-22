"use client";

import { PreferredLocationMap } from "@/features/users/presentation/preferred-location-map";

export function ListingLocationMap({ location }: { location: { lat: number; lng: number } | null }) {
  if (!location) return <p className="listing-location-empty">Ubicación aproximada no disponible.</p>;
  return <PreferredLocationMap value={`${location.lat},${location.lng}`} readOnly />;
}