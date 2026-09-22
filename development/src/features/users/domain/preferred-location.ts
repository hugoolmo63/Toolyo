export const DEVELOPMENT_PROFILE_USER_ID = "cmtlz6sfg00183zdkw3kg024a";
export const PREFERRED_LOCATION_SEPARATOR = ",";
export const PUBLIC_LOCATION_RADIUS_METERS = 750;
export const PUBLIC_LOCATION_JITTER_MIN_METERS = 150;
export const PUBLIC_LOCATION_JITTER_MAX_METERS = 400;
const EARTH_RADIUS_METERS = 6_371_000;

export type PreferredCoordinates = { lat: number; lng: number };

export function parsePreferredLocation(value: unknown): PreferredCoordinates | null {
  if (value === null || value === undefined) return null;

  let candidate: unknown = value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const pointMatch = trimmed.match(/^POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)$/i);
    if (pointMatch) candidate = { longitude: Number(pointMatch[1]), latitude: Number(pointMatch[2]) };
    else {
      try { candidate = JSON.parse(trimmed) as unknown; }
      catch {
        const [latText, lngText] = trimmed.split(PREFERRED_LOCATION_SEPARATOR).map((part) => part.trim());
        candidate = { latitude: Number(latText), longitude: Number(lngText) };
      }
    }
  }

  if (Array.isArray(candidate) && candidate.length >= 2) {
    candidate = { longitude: candidate[0], latitude: candidate[1] };
  }
  if (typeof candidate !== "object" || candidate === null) return null;
  const record = candidate as Record<string, unknown>;
  if (Array.isArray(record.coordinates) && record.coordinates.length >= 2) {
    candidate = { longitude: record.coordinates[0], latitude: record.coordinates[1] };
  } else if (record.geometry && typeof record.geometry === "object") {
    return parsePreferredLocation(record.geometry);
  }
  const coordinates = candidate as Record<string, unknown>;
  const lat = Number(coordinates.latitude ?? coordinates.lat ?? coordinates.y);
  const lng = Number(coordinates.longitude ?? coordinates.lng ?? coordinates.lon ?? coordinates.x);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  return { lat, lng };
}

export function formatPreferredLocation(coordinates: PreferredCoordinates): string {
  return `${coordinates.lat.toFixed(6)},${coordinates.lng.toFixed(6)}`;
}

/** Returns only a human-readable place label, never raw coordinates. */
export function formatPreferredLocationLabel(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || parsePreferredLocation(trimmed)) return null;
    try {
      return formatPreferredLocationLabel(JSON.parse(trimmed) as unknown);
    } catch {
      return trimmed.includes(",") ? trimmed : null;
    }
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  for (const key of ["label", "city", "cityName", "address", "displayName"]) {
    if (typeof record[key] === "string" && record[key].trim() && !parsePreferredLocation(record[key])) {
      return record[key].trim();
    }
  }
  return null;
}

/**
 * Obfuscates a public location with a stable, user-specific offset.
 * The offset is always smaller than the public 750m circle radius, so the
 * real location remains inside the circle but never at its geometric center.
 */
export function obfuscatePreferredLocation(
  coordinates: PreferredCoordinates,
  userId: string,
): PreferredCoordinates {
  let hash = 2_166_136_261;
  for (let index = 0; index < userId.length; index += 1) {
    hash ^= userId.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  const normalized = (hash >>> 0) / 4_294_967_295;
  const distance = PUBLIC_LOCATION_JITTER_MIN_METERS
    + normalized * (PUBLIC_LOCATION_JITTER_MAX_METERS - PUBLIC_LOCATION_JITTER_MIN_METERS);
  const bearing = (((hash >>> 8) % 360) * Math.PI) / 180;
  const angularDistance = distance / EARTH_RADIUS_METERS;
  const latitude = (coordinates.lat * Math.PI) / 180;
  const longitude = (coordinates.lng * Math.PI) / 180;
  const offsetLatitude = Math.asin(
    Math.sin(latitude) * Math.cos(angularDistance)
      + Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing),
  );
  const offsetLongitude = longitude + Math.atan2(
    Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
    Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(offsetLatitude),
  );

  return {
    lat: (offsetLatitude * 180) / Math.PI,
    lng: ((((offsetLongitude * 180) / Math.PI) + 540) % 360) - 180,
  };
}

export function distanceBetweenCoordinatesInMeters(
  first: PreferredCoordinates,
  second: PreferredCoordinates,
): number {
  const latitudeDelta = ((second.lat - first.lat) * Math.PI) / 180;
  const longitudeDelta = ((second.lng - first.lng) * Math.PI) / 180;
  const latitudeOne = (first.lat * Math.PI) / 180;
  const latitudeTwo = (second.lat * Math.PI) / 180;
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitudeOne) * Math.cos(latitudeTwo) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}