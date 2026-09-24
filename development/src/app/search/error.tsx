"use client";

import { useEffect } from "react";

/**
 * Error boundary de búsqueda — mensaje genérico y botón de reintentar.
 * No expone detalles técnicos al usuario (FRONTEND.md §6.3).
 */
export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log del error para debugging (no se muestra al usuario)
    // eslint-disable-next-line no-console
    console.error("Search error:", error);
  }, [error]);

  return (
    <div className="search-error" role="alert">
      <div className="error-icon" aria-hidden="true">⚠️</div>
      <h2>Algo salió mal</h2>
      <p>No se pudieron cargar los resultados. Inténtalo de nuevo.</p>
      <button type="button" onClick={reset} className="error-retry-btn">
        Reintentar
      </button>
    </div>
  );
}
