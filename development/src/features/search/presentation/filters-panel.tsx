"use client";

import { useState } from "react";
import { api } from "@/lib/trpc-react";
import {
  useSearchParamsState,
  useUpdateSearchParams,
  useClearSearchParams,
} from "@/hooks/use-search-params";

/**
 * FiltersPanel — filtros combinables de búsqueda.
 * Todos los filtros se comportan como AND lógico y se sincronizan con la URL.
 * Ver spec.md FR-004, FR-005, FR-006, FR-007 y contracts/search.md.
 */
export function FiltersPanel() {
  const params = useSearchParamsState();
  const updateParams = useUpdateSearchParams();
  const clearParams = useClearSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // Cargar categorías para el select
  const categories = api.category.list.useQuery(undefined, { staleTime: 60_000 });

  const hasActiveFilters =
    params.categoryId !== null ||
    params.dateStart !== null ||
    params.maxPrice !== null ||
    params.maxDist !== null ||
    params.minRating !== null ||
    params.verified;

  return (
    <div className="filters-panel">
      <button
        type="button"
        className="filters-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="filters-content"
      >
        Filtros {hasActiveFilters && <span className="filters-badge" aria-label="Filtros activos">●</span>}
      </button>

      {hasActiveFilters && (
        <button type="button" className="filters-clear" onClick={clearParams}>
          Limpiar filtros
        </button>
      )}

      {isOpen && (
        <div id="filters-content" className="filters-content">
          {/* Categoría */}
          <div className="filter-group">
            <label htmlFor="filter-category">Categoría</label>
            <select
              id="filter-category"
              value={params.categoryId ?? ""}
              onChange={(e) =>
                updateParams({ categoryId: e.target.value || null, page: null })
              }
            >
              <option value="">Todas</option>
              {categories.data
                ?.filter((parent) => parent.parentId === null)
                .map((parent) => {
                  const children = categories.data?.filter(
                    (category) => category.parentId === parent.id,
                  );

                  if (!children?.length) return null;

                  return (
                    <optgroup key={parent.id} label={parent.name}>
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
            </select>
          </div>

          {/* Rango de fechas */}
          <div className="filter-group">
            <label htmlFor="filter-date-start">Fecha de inicio</label>
            <input
              id="filter-date-start"
              type="date"
              value={params.dateStart ?? ""}
              onChange={(e) =>
                updateParams({ dateStart: e.target.value || null, page: null })
              }
            />
          </div>
          <div className="filter-group">
            <label htmlFor="filter-date-end">Fecha de fin</label>
            <input
              id="filter-date-end"
              type="date"
              value={params.dateEnd ?? ""}
              onChange={(e) =>
                updateParams({ dateEnd: e.target.value || null, page: null })
              }
            />
          </div>

          {/* Precio máximo */}
          <div className="filter-group">
            <label htmlFor="filter-max-price">Precio máximo por día (€)</label>
            <input
              id="filter-max-price"
              type="number"
              min={0}
              step={5}
              value={params.maxPrice ?? ""}
              onChange={(e) =>
                updateParams({
                  maxPrice: e.target.value ? Number(e.target.value) : null,
                  page: null,
                })
              }
              placeholder="Sin límite"
            />
          </div>

          {/* Distancia máxima */}
          <div className="filter-group">
            <fieldset disabled={params.lat === null}>
              <legend>Radio de búsqueda</legend>
              <div className="filter-radio-group">
                {[5, 10, 20, 50].map((radius) => (
                  <label key={radius} className="filter-radio-option">
                    <input
                      type="radio"
                      name="search-radius"
                      value={radius}
                      checked={params.radius === radius}
                      onChange={() => updateParams({ radius, maxDist: null, page: null })}
                    />
                    {radius} km
                  </label>
                ))}
              </div>
            </fieldset>
            {params.lat === null && (
              <p className="filter-hint">Selecciona una ubicación para filtrar por distancia.</p>
            )}
          </div>

          {/* Rating mínimo */}
          <div className="filter-group">
            <label htmlFor="filter-min-rating">Valoración mínima</label>
            <select
              id="filter-min-rating"
              value={params.minRating ?? ""}
              onChange={(e) =>
                updateParams({
                  minRating: e.target.value ? Number(e.target.value) : null,
                  page: null,
                })
              }
            >
              <option value="">Sin mínimo</option>
              <option value="3">3+ estrellas</option>
              <option value="4">4+ estrellas</option>
              <option value="4.5">4.5+ estrellas</option>
            </select>
          </div>

          {/* Solo verificados */}
          <div className="filter-group filter-checkbox">
            <label>
              <input
                type="checkbox"
                checked={params.verified}
                onChange={(e) =>
                  updateParams({ verified: e.target.checked || null, page: null })
                }
              />
              Solo arrendadores verificados
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
