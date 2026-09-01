import { PrismaClient } from "@prisma/client";
import {
  findPublishedListingsRandom,
  findPublishedListingsFiltered,
  findPublishedListingsInBounds,
  type RawListingRow,
} from "../infrastructure/listing.repository";
import { searchLocationsNominatim } from "../infrastructure/geocoding.repository";
import { haversineDistanceKm } from "@/server/lib/geo/distance";
import type {
  SearchResultDTO,
  SearchResultsPage,
  LocationSuggestion,
  CategorySuggestion,
  MapPin,
} from "@/features/search/domain/search-result";
import type {
  SearchQueryInput,
  SearchInitialInput,
  SuggestInput,
  MapBoundsQueryInput,
} from "@/features/search/shared/search.schema";

/**
 * Servicio de aplicación de búsqueda pública (004-public-search).
 * Orquesta repositorios y mapea a DTOs públicos sin datos privados.
 * Ver contracts/search.md.
 */

/**
 * Genera un seed aleatorio entero estable para paginación coherente de aleatorios.
 */
function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

/**
 * Mapea una fila raw de Listing a SearchResultDTO (solo campos públicos).
 * Nunca incluye email, teléfono, dirección exacta ni datos de pago.
 */
function mapToDTO(row: RawListingRow, userLat?: number, userLng?: number): SearchResultDTO {
  let distanceKm: number | null = null;
  if (userLat !== undefined && userLng !== undefined && row.lat && row.lng) {
    if (row.distance_meters !== null) {
      distanceKm = Math.round((Number(row.distance_meters) / 1000) * 100) / 100;
    } else {
      distanceKm = haversineDistanceKm(
        userLat,
        userLng,
        Number(row.lat),
        Number(row.lng),
      );
    }
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    pricePerDay: Number(row.pricePerDay),
    primaryPhotoUrl: row.primaryPhotoUrl,
    ratingAverage: Number(row.ratingAverage),
    reviewCount: row.reviewCount,
    distanceKm,
    city: row.city,
    location:
      row.lat && row.lng
        ? { lat: Number(row.lat), lng: Number(row.lng) }
        : null,
    owner: {
      id: row.ownerId,
      // El displayName real se resolvería desde el perfil del usuario;
      // por ahora usamos un placeholder público hasta que la feature de perfil exista.
      displayName: row.ownerDisplayName ?? "Arrendador",
      avatarUrl: row.ownerAvatarUrl,
      isVerified: row.ownerIsVerified,
    },
  };
}

/**
 * Búsqueda inicial: resultados aleatorios sin criterios.
 * Genera un seed si no se proporciona para coherencia al paginar.
 */
export async function searchInitial(
  prisma: PrismaClient,
  input: SearchInitialInput,
): Promise<SearchResultsPage> {
  const seed = input.seed ?? generateSeed();
  const limit = input.limit;

  const { rows, total } = await findPublishedListingsRandom(prisma, { seed, limit });

  const items = rows.map((r) => mapToDTO(r));
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    items,
    total,
    hasMore: total > limit,
    nextCursor: items.length > 0 ? `${items[items.length - 1]!.id}` : null,
    page: 1,
    totalPages,
    seed,
  };
}

/**
 * Búsqueda con criterios: filtros, ordenación y paginación.
 */
export async function searchQuery(
  prisma: PrismaClient,
  input: SearchQueryInput,
): Promise<SearchResultsPage> {
  // Si no hay criterios, delegar a searchInitial con el seed
  const hasCriteria =
    input.query ||
    input.location ||
    input.categoryId ||
    input.dateRange ||
    input.maxPricePerDay !== undefined ||
    input.maxDistanceKm !== undefined ||
    input.minRating !== undefined ||
    input.onlyVerified;

  if (!hasCriteria && input.sortBy === "relevance") {
    return searchInitial(prisma, {
      seed: input.seed,
      limit: input.limit,
    });
  }

  const { rows, total } = await findPublishedListingsFiltered(prisma, input);
  const items = rows.map((r) =>
    mapToDTO(r, input.location?.lat, input.location?.lng),
  );

  const page = input.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(total / input.limit));
  const hasMore = page * input.limit < total;

  return {
    items,
    total,
    hasMore,
    nextCursor: items.length > 0 ? items[items.length - 1]!.id : null,
    page,
    totalPages,
    seed: input.seed ?? null,
  };
}

/**
 * Autocompletado de ubicaciones y categorías.
 */
export async function searchSuggest(
  prisma: PrismaClient,
  input: SuggestInput,
): Promise<{
  locations: LocationSuggestion[];
  categories: CategorySuggestion[];
}> {
  const locations: LocationSuggestion[] = [];
  const categories: CategorySuggestion[] = [];

  if (input.type === "all" || input.type === "locations") {
    const locs = await searchLocationsNominatim(input.query, input.limit);
    locations.push(...locs);
  }

  if (input.type === "all" || input.type === "categories") {
    // Búsqueda insensible a mayúsculas y diacríticos en categorías
    const cats = await prisma.category.findMany({
      where: {
        name: { contains: input.query, mode: "insensitive" },
        showInNav: true,
        deletedAt: null,
      },
      take: input.limit,
      orderBy: { name: "asc" },
    });
    categories.push(
      ...cats.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        parentId: c.parentId,
      })),
    );
  }

  return { locations, categories };
}

/**
 * Pins del mapa: listings dentro de un bounding box con campos mínimos.
 */
export async function searchMapBounds(
  prisma: PrismaClient,
  input: MapBoundsQueryInput,
): Promise<MapPin[]> {
  const rows = await findPublishedListingsInBounds(prisma, {
    bounds: input.bounds,
    filters: {
      query: input.query,
      categoryId: input.categoryId,
      dateRange: input.dateRange,
      maxPricePerDay: input.maxPricePerDay,
      minRating: input.minRating,
      onlyVerified: input.onlyVerified,
      sortBy: "relevance",
      limit: input.limit,
    },
    limit: input.limit,
  });

  return rows.map((r) => ({
    id: r.id,
    lat: r.lat ? Number(r.lat) : 0,
    lng: r.lng ? Number(r.lng) : 0,
    title: r.title,
    pricePerDay: Number(r.pricePerDay),
    primaryPhotoUrl: r.primaryPhotoUrl,
    ratingAverage: Number(r.ratingAverage),
  }));
}
