"use client";

import { useSearchParamsState, useUpdateSearchParams } from "@/hooks/use-search-params";

/**
 * ViewToggle — alterna entre vista grid y lista.
 * Actualiza `?view=` en la URL conservando resultados, filtros y ordenación.
 * Ver spec.md FR-014 y contracts/search.md.
 */
export function ViewToggle() {
  const params = useSearchParamsState();
  const updateParams = useUpdateSearchParams();

  return (
    <div className="view-toggle" role="group" aria-label="Cambiar vista">
      <button
        type="button"
        className={`view-toggle-btn ${params.view === "grid" ? "active" : ""}`}
        onClick={() => updateParams({ view: "grid" })}
        aria-pressed={params.view === "grid"}
        aria-label="Vista de cuadrícula"
      >
        ▦ Grid
      </button>
      <button
        type="button"
        className={`view-toggle-btn ${params.view === "list" ? "active" : ""}`}
        onClick={() => updateParams({ view: "list" })}
        aria-pressed={params.view === "list"}
        aria-label="Vista de lista"
      >
        ☰ Lista
      </button>
    </div>
  );
}
