"use client";

import { useSearchParamsState, useUpdateSearchParams } from "@/hooks/use-search-params";

/**
 * SortSelector — select de criterio de ordenación.
 * Actualiza `?sort=` en la URL sin perder los filtros aplicados.
 * Ver spec.md FR-009 y contracts/search.md.
 */
const SORT_OPTIONS = [
  { value: "relevance", label: "Relevancia" },
  { value: "nearest", label: "Más cercano" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "best_rated", label: "Mejor valorado" },
  { value: "most_popular", label: "Más popular" },
] as const;

export function SortSelector() {
  const params = useSearchParamsState();
  const updateParams = useUpdateSearchParams();

  return (
    <div className="sort-selector">
      <label htmlFor="sort-select" className="sr-only">
        Ordenar resultados
      </label>
      <select
        id="sort-select"
        value={params.sort}
        onChange={(e) => updateParams({ sort: e.target.value, page: null })}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
