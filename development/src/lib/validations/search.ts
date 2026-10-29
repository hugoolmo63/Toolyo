/**
 * Re-export de schemas Zod del dominio Search para uso desde el router.
 * (004-public-search)
 */
export {
  SearchQuerySchema,
  SearchMapResultsSchema,
  SearchInitialSchema,
  SuggestSchema,
  MapBoundsQuerySchema,
  SortBySchema,
  SearchLocationSchema,
  DateRangeSchema,
  MapBoundsSchema,
} from "@/features/search/shared/search.schema";
