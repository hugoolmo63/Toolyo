/**
 * Tipos de dominio de los parámetros de búsqueda (004-public-search).
 * Re-exporta los tipos inferidos de Zod para uso transversal.
 */
export type {
  SearchQueryInput,
  SearchInitialInput,
  SuggestInput,
  MapBoundsQueryInput,
  SortBy,
  SearchLocation,
  DateRange,
  MapBounds,
} from "../shared/search.schema";

/** Vista de resultados: grid de tarjetas o lista compacta. */
export type SearchView = "grid" | "list";
