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

const ALLOWED_PLACE_TYPES = new Set([
  "administrative",
  "city",
  "municipality",
  "town",
  "village",
]);

interface NominatimResult {
  display_name?: string;
  lat: string;
  lon: string;
  type: string;
  address?: Record<string, string | undefined>;
}

function firstAddressValue(address: Record<string, string | undefined>, ...keys: string[]): string | undefined {
  return keys.map((key) => address[key]?.trim()).find((value) => value) || undefined;
}

function formatLocationSuggestion(item: NominatimResult): LocationSuggestion | null {
  if (!ALLOWED_PLACE_TYPES.has(item.type)) return null;

  const lat = Number.parseFloat(item.lat);
  const lng = Number.parseFloat(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const address = item.address ?? {};
  const city = firstAddressValue(address, "city", "town", "village", "municipality");
  const region = firstAddressValue(address, "state", "region", "province", "state_district");
  const province = firstAddressValue(address, "province", "state_district");

  // Prefer the autonomous community (state/region) when it is distinct from the city;
  // otherwise add the province. Never fall back to display_name, which can contain a street.
  const context = region && region.toLocaleLowerCase() !== city?.toLocaleLowerCase()
    ? region
    : province && province.toLocaleLowerCase() !== city?.toLocaleLowerCase()
      ? province
      : undefined;
  const text = [city, context].filter(Boolean).join(", ");
  if (!text) return null;

  return { text, lat, lng, type: item.type };
}

function normalizeLocationText(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase();
}

function deduplicateLocationSuggestions(
  suggestions: LocationSuggestion[],
  limit: number,
): LocationSuggestion[] {
  const specificity = new Map<string, number>([
    ["city", 5],
    ["town", 4],
    ["village", 3],
    ["municipality", 2],
    ["administrative", 1],
  ]);
  const uniqueByText = new Map<string, LocationSuggestion>();

  for (const suggestion of suggestions) {
    const key = normalizeLocationText(suggestion.text);
    const previous = uniqueByText.get(key);
    if (!previous || (specificity.get(suggestion.type) ?? 0) > (specificity.get(previous.type) ?? 0)) {
      uniqueByText.set(key, suggestion);
    }
  }

  const uniqueSuggestions = Array.from(uniqueByText.values());
  const specificLocations = uniqueSuggestions.filter((suggestion) => suggestion.type !== "administrative");
  const withoutGenericRegions = uniqueSuggestions.filter((suggestion) => {
    if (suggestion.type !== "administrative") return true;

    const genericName = normalizeLocationText(suggestion.text);
    return !specificLocations.some((specific) =>
      specific.text.split(",").some((part) => normalizeLocationText(part) === genericName),
    );
  });

  return withoutGenericRegions.slice(0, limit);
}

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
    // Fetch extra candidates because filtering street-level results and duplicates
    // can otherwise leave fewer than the requested number of useful suggestions.
    url.searchParams.set("limit", String(Math.min(limit * 3, 30)));
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("featuretype", "city");
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

    const data = (await response.json()) as NominatimResult[];
    const formattedSuggestions = data
      .map(formatLocationSuggestion)
      .filter((suggestion): suggestion is LocationSuggestion => suggestion !== null);
    const suggestions = deduplicateLocationSuggestions(formattedSuggestions, limit);

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
