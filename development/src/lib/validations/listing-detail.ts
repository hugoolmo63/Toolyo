/**
 * Re-export de schemas Zod del dominio Listing Detail para uso desde el router
 * y otros módulos del servidor (FRONTEND.md §2.1, BACKEND.md §5).
 */
export {
  GetBySlugSchema,
  GetSimilarSchema,
  IncrementViewSchema,
  DateRangeSchema,
} from "@/features/listing-detail/shared/listing-detail.schema";
export type {
  GetBySlugInput,
  GetSimilarInput,
  IncrementViewInput,
  DateRange,
} from "@/features/listing-detail/shared/listing-detail.schema";
