"use client";

import { useEffect } from "react";

/**
 * Error boundary de detalle — mensaje genérico y botón de reintentar.
 * No expone detalles técnicos al usuario (FRONTEND.md §6.3).
 */
export default function ListingDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Listing detail error:", error);
  }, [error]);

  return (
    <div className="listing-error" role="alert">
      <div className="error-icon" aria-hidden="true">⚠️</div>
      <h2>No se pudo cargar el producto</h2>
      <p>Inténtalo de nuevo en unos instantes.</p>
      <button type="button" onClick={reset} className="error-retry-btn">
        Reintentar
      </button>
    </div>
  );
}
