/**
 * Skeleton de resultados de búsqueda (FRONTEND.md §6.3).
 * Se muestra mientras cargan los resultados en la landing.
 */
export default function SearchLoading() {
  return (
    <div className="search-page" aria-busy="true">
      <div className="search-header">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-text" />
        <div className="skeleton-bar" />
      </div>
      <div className="results-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="result-card-skeleton">
            <div className="skeleton-image" />
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line skeleton-text" />
            <div className="skeleton-line skeleton-text" />
          </div>
        ))}
      </div>
    </div>
  );
}
