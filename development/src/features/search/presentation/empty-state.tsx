import Link from "next/link";

/**
 * EmptyState — estado vacío útil cuando no hay resultados.
 * Sugiere relajar criterios o explorar categorías populares.
 * Ver spec.md FR-013.
 */
interface EmptyStateProps {
  hasFilters: boolean;
  activeFilters?: string[];
}

export function EmptyState({ hasFilters, activeFilters = [] }: EmptyStateProps) {
  return (
    <div className="search-empty-state" role="status">
      <div className="empty-state-icon" aria-hidden="true">🔍</div>
      <h2 className="empty-state-title">
        {hasFilters ? "No se encontraron resultados" : "Aún no hay productos publicados"}
      </h2>
      <p className="empty-state-message">
        {hasFilters
          ? "Prueba a relajar algunos criterios de búsqueda o explora categorías populares."
          : "Vuelve más tarde o sé el primero en publicar un producto para alquilar."}
      </p>
      {hasFilters && activeFilters.length > 0 && (
        <div className="empty-state-active-filters">
          <p className="empty-state-filters-label">Filtros activos:</p>
          <ul className="empty-state-filter-list">
            {activeFilters.map((filter, i) => (
              <li key={i} className="empty-state-filter-tag">{filter}</li>
            ))}
          </ul>
        </div>
      )}
      {hasFilters && (
        <div className="empty-state-actions">
          <Link href="/" className="empty-state-link">
            Limpiar filtros
          </Link>
        </div>
      )}
    </div>
  );
}
