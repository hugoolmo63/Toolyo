"use client";

import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { ResultCard } from "./result-card";
import { ResultRow } from "./result-row";
import { EmptyState } from "./empty-state";
import type { SearchResultDTO, SearchView } from "@/types/search";

/**
 * ResultsList — lista de resultados de búsqueda.
 * Soporta vista grid y lista, skeletons durante carga, empty state y
 * scroll infinito en todos los dispositivos (IntersectionObserver).
 * Ver spec.md FR-008, FR-011, FR-014, FR-015.
 */
interface ResultsListProps {
  results: SearchResultDTO[];
  isLoading: boolean;
  hasFilters: boolean;
  activeFilters?: string[];
  view?: SearchView;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isMobile?: boolean;
}

export function ResultsList({
  results,
  isLoading,
  hasFilters,
  activeFilters = [],
  view = "grid",
  hasMore = false,
  onLoadMore,
  isMobile = false,
}: ResultsListProps) {
  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    enabled: hasMore && Boolean(onLoadMore),
    onLoadMore: () => onLoadMore?.(),
  });

  if (isLoading) {
    return (
      <div className={view === "grid" ? "results-grid" : "results-list-view"} aria-busy="true" aria-live="polite">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="result-card-skeleton">
            <div className="skeleton-image" />
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line skeleton-text" />
            <div className="skeleton-line skeleton-text" />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return <EmptyState hasFilters={hasFilters} activeFilters={activeFilters} />;
  }

  return (
    <>
      {view === "grid" ? (
        <div className="results-grid">
          {results.map((listing) => (
            <ResultCard key={listing.id} listing={listing} openInNewTab={!isMobile} />
          ))}
        </div>
      ) : (
        <div className="results-list-view">
          {results.map((listing) => (
            <ResultRow key={listing.id} listing={listing} openInNewTab={!isMobile} />
          ))}
        </div>
      )}

      {/* Scroll infinito: el centinela dispara la carga de la siguiente página */}
      {hasMore && (
        <div ref={sentinelRef} className="infinite-scroll-sentinel" aria-live="polite">
          <span className="loading-more">Cargando más resultados...</span>
        </div>
      )}
    </>
  );
}
