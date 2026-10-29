import { z } from "zod";

/**
 * Schemas Zod del dominio Listing Detail (005-listing-detail).
 * Única fuente de verdad para front y back. Ver contracts/listing-detail.md.
 */

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Slug o ID del listing para resolver enlaces públicos. */
export const GetBySlugSchema = z.object({
  slug: z.string().min(1, "slug es obligatorio").max(200),
});

/** Input para obtener productos similares a un listing. */
export const GetSimilarSchema = z.object({
  listingId: z.string().min(1),
  categoryId: z.string().min(1),
  city: z.string().max(200).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  limit: z.number().int().positive().max(12).default(6),
});

/** Input para incrementar el contador de vistas de un listing. */
export const IncrementViewSchema = z.object({
  listingId: z.string().min(1),
});

/** Rango de fechas (recogida y devolución). end debe ser posterior a start. */
export const DateRangeSchema = z
  .object({
    start: z.string().regex(ISO_DATE_REGEX, "start debe ser ISO date (YYYY-MM-DD)"),
    end: z.string().regex(ISO_DATE_REGEX, "end debe ser ISO date (YYYY-MM-DD)"),
  })
  .refine((d) => d.end > d.start, {
    message: "end debe ser posterior a start",
    path: ["end"],
  });

export type GetBySlugInput = z.infer<typeof GetBySlugSchema>;
export type GetSimilarInput = z.infer<typeof GetSimilarSchema>;
export type IncrementViewInput = z.infer<typeof IncrementViewSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
