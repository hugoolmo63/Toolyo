import { Suspense } from "react";
import { prisma } from "@/server/db/client";
import { searchInitial, searchQuery } from "@/features/search/application/search.service";
import { SearchPage } from "@/features/search/presentation/search-page";
import type { SearchResultsPage } from "@/types/search";

/**
 * Página raíz — landing de búsqueda pública (004-public-search).
 * Server Component que lee los query params y precarga resultados:
 * - Sin criterios: search.initial (resultados aleatorios)
 * - Con criterios: search.query (resultados filtrados)
 * No requiere sesión ni identificación (FR-001, FR-018, FR-019).
 */
interface HomePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

function parseParam(param: string | string[] | undefined): string | null {
  if (param === undefined) return null;
  return Array.isArray(param) ? (param[0] ?? null) : param;
}

function parseNumberParam(param: string | string[] | undefined): number | null {
  const val = parseParam(param);
  if (val === null || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

export default async function Home({ searchParams }: HomePageProps) {
  const query = parseParam(searchParams.q) ?? "";
  const lat = parseNumberParam(searchParams.lat);
  const lng = parseNumberParam(searchParams.lng);
  const locationText = parseParam(searchParams.loc) ?? "";
  const categoryId = parseParam(searchParams.cat);
  const dateStart = parseParam(searchParams.dateStart);
  const dateEnd = parseParam(searchParams.dateEnd);
  const maxPrice = parseNumberParam(searchParams.maxPrice);
  const maxDist = parseNumberParam(searchParams.maxDist);
  const parsedRadius = parseNumberParam(searchParams.radius);
  const radius = parsedRadius === 5 || parsedRadius === 10 || parsedRadius === 20 || parsedRadius === 50
    ? parsedRadius
    : 50;
  const minRating = parseNumberParam(searchParams.minRating);
  const verified = parseParam(searchParams.verified) === "true";
  const sort = parseParam(searchParams.sort) ?? "relevance";
  const seed = parseNumberParam(searchParams.seed);
  const page = parseNumberParam(searchParams.page) ?? 1;

  const hasCriteria = Boolean(
    query ||
      (lat !== null && lng !== null) ||
      categoryId ||
      (dateStart && dateEnd) ||
      maxPrice !== null ||
      maxDist !== null ||
      minRating !== null ||
      verified,
  );

  let initialResults: SearchResultsPage | null = null;

  try {
    if (hasCriteria) {
      initialResults = await searchQuery(prisma, {
        query: query || undefined,
        location:
          lat !== null && lng !== null
            ? { lat, lng, text: locationText }
            : undefined,
        categoryId: categoryId ?? undefined,
        dateRange:
          dateStart && dateEnd ? { startDate: dateStart, endDate: dateEnd } : undefined,
        maxPricePerDay: maxPrice ?? undefined,
        maxDistanceKm: maxDist ?? undefined,
        radius,
        minRating: minRating ?? undefined,
        onlyVerified: verified || undefined,
        sortBy: (sort as "relevance" | "nearest" | "price_asc" | "price_desc" | "best_rated" | "most_popular") ?? "relevance",
        page: page > 1 ? page : undefined,
        seed: seed ?? undefined,
        limit: 24,
      });
    } else {
      initialResults = await searchInitial(prisma, {
        seed: seed ?? undefined,
        limit: 24,
      });
    }
  } catch {
    // Si la precarga falla, el cliente reintentará con React Query
    initialResults = null;
  }

  return (
    <Suspense fallback={<div className="search-loading">Cargando...</div>}>
      <SearchPage initialResults={initialResults} />
    </Suspense>
  );
}
