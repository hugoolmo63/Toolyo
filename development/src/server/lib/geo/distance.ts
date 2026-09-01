/**
 * Cálculo de distancia Haversine entre dos puntos geográficos.
 * Usado para calcular `distanceKm` en el DTO cuando se tiene la `location`
 * del usuario y las coordenadas del listing.
 * Ver research.md (PostGIS con ST_DWithin y ST_Distance).
 */

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Distancia en kilómetros entre dos coordenadas (lat/lng en WGS84).
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 100) / 100;
}
