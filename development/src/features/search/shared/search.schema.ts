import { z } from "zod";

/**
 * Schemas Zod compartidos del dominio Search (004-public-search).
 * Única fuente de verdad para front y back.
 */

export const SortBySchema = z.enum([
  "relevance",
  "nearest",
  "price_asc",
  "price_desc",
  "best_rated",
  "most_popular",
]);

export const SearchLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  text: z.string().min(1).max(200),
});

export const DateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate debe ser ISO date (YYYY-MM-DD)"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "endDate debe ser ISO date (YYYY-MM-DD)"),
});

export const MapBoundsSchema = z.object({
  north: z.number().min(-90).max(90),
  south: z.number().min(-90).max(90),
  east: z.number().min(-180).max(180),
  west: z.number().min(-180).max(180),
});

export const SearchQuerySchema = z.object({
  query: z.string().max(200).optional(),
  location: SearchLocationSchema.optional(),
  categoryId: z.string().cuid().optional(),
  dateRange: DateRangeSchema.optional(),
  maxPricePerDay: z.number().positive().max(100000).optional(),
  maxDistanceKm: z.number().positive().max(500).optional(),
  minRating: z.number().min(0).max(5).optional(),
  onlyVerified: z.boolean().optional(),
  sortBy: SortBySchema.default("relevance"),
  page: z.number().int().positive().max(1000).optional(),
  cursor: z.string().optional(),
  seed: z.number().int().optional(),
  limit: z.number().int().positive().max(48).default(24),
});

export const SearchInitialSchema = z.object({
  seed: z.number().int().optional(),
  limit: z.number().int().positive().max(48).default(24),
});

export const SuggestTypeSchema = z.enum(["all", "locations", "categories"]);

export const SuggestSchema = z.object({
  query: z.string().min(2, "Mínimo 2 caracteres").max(200),
  type: SuggestTypeSchema.default("all"),
  limit: z.number().int().positive().max(12).default(6),
});

export const MapBoundsQuerySchema = z.object({
  bounds: MapBoundsSchema,
  query: z.string().max(200).optional(),
  categoryId: z.string().cuid().optional(),
  dateRange: DateRangeSchema.optional(),
  maxPricePerDay: z.number().positive().max(100000).optional(),
  minRating: z.number().min(0).max(5).optional(),
  onlyVerified: z.boolean().optional(),
  limit: z.number().int().positive().max(200).default(100),
});

export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
export type SearchInitialInput = z.infer<typeof SearchInitialSchema>;
export type SuggestInput = z.infer<typeof SuggestSchema>;
export type MapBoundsQueryInput = z.infer<typeof MapBoundsQuerySchema>;
export type SortBy = z.infer<typeof SortBySchema>;
export type SearchLocation = z.infer<typeof SearchLocationSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type MapBounds = z.infer<typeof MapBoundsSchema>;
