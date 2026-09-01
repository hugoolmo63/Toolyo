/**
 * Re-export de tipos públicos del dominio Search para uso transversal.
 * (004-public-search)
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
} from "@/features/search/shared/search.schema";

export type {
  SearchResultDTO,
  SearchResultOwner,
  SearchResultsPage,
  LocationSuggestion,
  CategorySuggestion,
  MapPin,
} from "@/features/search/domain/search-result";

export type { SearchView } from "@/features/search/domain/search-params";
