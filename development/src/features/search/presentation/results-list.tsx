"use client";

import { useRef, useEffect } from "react";
import { ResultCard } from "./result-card";
import { ResultRow } from "./result-row";
import { EmptyState } from "./empty-state";
import type { SearchResultDTO, SearchView } from "@/types/search";

/**
 * ResultsList — lista de resultados de búsqueda.
 * Soporta vista grid y lista, skeletons durante carga, empty state,
 * infinite scroll en móvil (IntersectionObserver) y paginación numerada en desktop.
 * Ver spec.md FR-008, FR-011, FR-014, FR-015.
 */
interface ResultsListProps {
  results: SearchResultDTO[];
  isLoading: boolean;
  hasFilters: boolean;
  activeFilters?: string[];
  view?: SearchView;
  page?: number;
  totalPages?: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onPageChange?: (page: number) => void;
  isMobile?: boolean;
}

export function ResultsList({
  results,
  isLoading,
  hasFilters,
  activeFilters = [],
  view = "grid",
  page = 1,
  totalPages = 1,
  hasMore = false,
  onLoadMore,
  onPageChange,
  isMobile = false,
}: ResultsListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll en móvil con IntersectionObserver
  useEffect(() => {
    if (!isMobile || !hasMore || !onLoadMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isMobile, hasMore, onLoadMore]);

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
            <ResultCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="results-list-view">
          {results.map((listing) => (
            <ResultRow key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel (móvil) */}
      {isMobile && hasMore && (
        <div ref={sentinelRef} className="infinite-scroll-sentinel" aria-live="polite">
          <span className="loading-more">Cargando más resultados...</span>
        </div>
      )}

      {/* Paginación numerada (desktop) */}
      {!isMobile && totalPages > 1 && onPageChange && (
        <nav className="pagination" aria-label="Paginación de resultados">
          <button
            type="button"
            className="pagination-btn"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            ← Anterior
          </button>
          <span className="pagination-info">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            className="pagination-btn"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            aria-label="Página siguiente"
          >
            Siguiente →
          </button>
        </nav>
      )}
    </>
  );
}
