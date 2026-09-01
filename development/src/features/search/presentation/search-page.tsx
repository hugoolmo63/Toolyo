"use client";

import { useMemo, useState, useEffect } from "react";
import { api } from "@/lib/trpc-react";
import { SearchBar } from "./search-bar";
import { LocationDetector } from "./location-detector";
import { ResultsList } from "./results-list";
import { FiltersPanel } from "./filters-panel";
import { SortSelector } from "./sort-selector";
import { ViewToggle } from "./view-toggle";
import { MapView } from "./map-view";
import {
  useSearchParamsState,
  useUpdateSearchParams,
} from "@/hooks/use-search-params";
import type { SearchResultsPage, MapPin } from "@/types/search";

/**
 * SearchPage — orquesta la barra de búsqueda, detector de ubicación, filtros,
 * ordenación, vistas (grid/lista/mapa) y paginación adaptativa.
 * Sincroniza todo el estado con la URL.
 * Ver spec.md FR-001, FR-018, FR-019 y contracts/search.md.
 */
interface SearchPageProps {
  initialResults?: SearchResultsPage | null;
}

const MOBILE_BREAKPOINT = 768;
const MAX_INFINITE_RESULTS = 200;

export function SearchPage({ initialResults }: SearchPageProps) {
  const params = useSearchParamsState();
  const updateParams = useUpdateSearchParams();
  const [isMobile, setIsMobile] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Detectar móvil por breakpoint
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const hasCriteria = Boolean(
    params.query ||
      params.lat !== null ||
      params.categoryId ||
      params.dateStart ||
      params.maxPrice !== null ||
      params.maxDist !== null ||
      params.minRating !== null ||
      params.verified,
  );

  const queryInput = useMemo(
    () => ({
      query: params.query || undefined,
      location:
        params.lat !== null && params.lng !== null
          ? { lat: params.lat, lng: params.lng, text: params.locationText || "" }
          : undefined,
      categoryId: params.categoryId ?? undefined,
      dateRange:
        params.dateStart && params.dateEnd
          ? { startDate: params.dateStart, endDate: params.dateEnd }
          : undefined,
      maxPricePerDay: params.maxPrice ?? undefined,
      maxDistanceKm: params.maxDist ?? undefined,
      minRating: params.minRating ?? undefined,
      onlyVerified: params.verified || undefined,
      sortBy: (params.sort as "relevance" | "nearest" | "price_asc" | "price_desc" | "best_rated" | "most_popular") ?? "relevance",
      page: params.page > 1 ? params.page : undefined,
      seed: params.seed ?? undefined,
      limit: 24,
    }),
    [params],
  );

  const initialInput = useMemo(
    () => ({ seed: params.seed ?? undefined, limit: 24 }),
    [params.seed],
  );

  const queryResult = api.search.query.useQuery(queryInput, {
    enabled: hasCriteria,
    initialData: hasCriteria && initialResults ? initialResults : undefined,
    staleTime: 30_000,
  });

  const initialResult = api.search.initial.useQuery(initialInput, {
    enabled: !hasCriteria,
    initialData: !hasCriteria && initialResults ? initialResults : undefined,
    staleTime: 30_000,
  });

  // Map bounds query (solo cuando se muestra el mapa)
  const mapBounds = api.search.mapBounds.useQuery(
    {
      bounds: { north: 41, south: 40, east: 2, west: -4 }, // default: España central
      query: params.query || undefined,
      categoryId: params.categoryId ?? undefined,
      dateRange:
        params.dateStart && params.dateEnd
          ? { startDate: params.dateStart, endDate: params.dateEnd }
          : undefined,
      maxPricePerDay: params.maxPrice ?? undefined,
      minRating: params.minRating ?? undefined,
      onlyVerified: params.verified || undefined,
      limit: 100,
    },
    { enabled: showMap, staleTime: 30_000 },
  );

  const results = hasCriteria ? queryResult.data : initialResult.data;
  const isLoading = hasCriteria ? queryResult.isLoading : initialResult.isLoading;
  const hasActiveFilters = hasCriteria || params.sort !== "relevance";

  const activeFilters: string[] = useMemo(() => {
    const filters: string[] = [];
    if (params.query) filters.push(`Búsqueda: ${params.query}`);
    if (params.locationText) filters.push(`Ubicación: ${params.locationText}`);
    if (params.categoryId) filters.push("Categoría seleccionada");
    if (params.dateStart && params.dateEnd) filters.push(`Fechas: ${params.dateStart} - ${params.dateEnd}`);
    if (params.maxPrice !== null) filters.push(`Precio máx: ${params.maxPrice}€/día`);
    if (params.maxDist !== null) filters.push(`Distancia máx: ${params.maxDist} km`);
    if (params.minRating !== null) filters.push(`Valoración mín: ${params.minRating}★`);
    if (params.verified) filters.push("Solo verificados");
    if (params.sort !== "relevance") filters.push(`Orden: ${params.sort}`);
    return filters;
  }, [params]);

  const pins: MapPin[] = mapBounds.data ?? [];

  return (
    <div className="search-page">
      <header className="search-header">
        <h1 className="search-title">Encuentra lo que necesitas, alquila con confianza</h1>
        <p className="search-subtitle">
          Miles de productos disponibles para alquilar cerca de ti.
        </p>
        <div className="search-controls">
          <SearchBar />
          <LocationDetector />
        </div>
      </header>

      <main className="search-results">
        <div className="results-toolbar">
          <span className="results-count">
            {results?.total !== undefined && `${results.total} resultado${results.total !== 1 ? "s" : ""}`}
          </span>
          <SortSelector />
          <FiltersPanel />
          <ViewToggle />
          <button
            type="button"
            className={`map-toggle-btn ${showMap ? "active" : ""}`}
            onClick={() => setShowMap(!showMap)}
            aria-pressed={showMap}
            aria-label="Alternar vista de mapa"
          >
            🗺️ Mapa
          </button>
        </div>

        {showMap && (
          <div className="map-container">
            <MapView
              center={
                params.lat !== null && params.lng !== null
                  ? { lat: params.lat, lng: params.lng }
                  : null
              }
              pins={pins}
              isLoading={mapBounds.isLoading}
            />
          </div>
        )}

        <ResultsList
          results={results?.items ?? []}
          isLoading={isLoading && !results}
          hasFilters={hasActiveFilters}
          activeFilters={activeFilters}
          view={params.view}
          page={results?.page ?? 1}
          totalPages={results?.totalPages ?? 1}
          hasMore={results?.hasMore ?? false}
          onPageChange={(p) => updateParams({ page: p })}
          isMobile={isMobile}
        />
      </main>
    </div>
  );
}
