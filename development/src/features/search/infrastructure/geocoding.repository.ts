import type { LocationSuggestion } from "@/features/search/domain/search-result";

/**
 * Repositorio de geocoding — llama a Nominatim (OpenStreetMap) para autocompletado
 * de ubicaciones. Cachea resultados en memoria (TTL 5 min) para reducir llamadas
 * y respetar la política de uso de Nominatim (max 1 req/segundo).
 * Ver research.md (Nominatim).
 */

interface CacheEntry {
  suggestions: LocationSuggestion[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

const GEOCODING_BASE_URL =
  process.env.GEOCODING_BASE_URL ?? "https://nominatim.openstreetmap.org";

/**
 * Busca ubicaciones en Nominatim con sufijo ", España" (mercado inicial).
 * Devuelve sugerencias tipadas. Tolerante a errores de red (devuelve []).
 */
export async function searchLocationsNominatim(
  query: string,
  limit: number,
): Promise<LocationSuggestion[]> {
  const cacheKey = `nominatim:${query.toLowerCase()}:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.suggestions;
  }

  try {
    const url = new URL("/search", GEOCODING_BASE_URL);
    url.searchParams.set("q", `${query}, España`);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("addressdetails", "0");
    url.searchParams.set("accept-language", "es");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Toolyo/1.0 (https://toolyo.dev)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      type: string;
    }>;

    const suggestions: LocationSuggestion[] = data.map((item) => ({
      text: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
    }));

    cache.set(cacheKey, {
      suggestions,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return suggestions;
  } catch {
    // Errores de red, timeout, etc. — devolver vacío sin propagar el error
    return [];
  }
}

/**
 * Limpia la caché de geocoding (para tests).
 */
export function clearGeocodingCache(): void {
  cache.clear();
}
