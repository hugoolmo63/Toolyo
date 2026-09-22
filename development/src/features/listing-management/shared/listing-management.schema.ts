import { z } from "zod";

const ListingStatusSchema = z.enum(["draft", "in_review", "published", "paused", "rejected"]);

const PhotoInputSchema = z.object({
  id: z.string().cuid().optional(),
  url: z.string().url("La imagen debe tener una URL válida").max(2048),
  altText: z.string().trim().max(160).optional(),
  order: z.number().int().min(0).max(99),
});

const LocationFieldsSchema = z.object({
  city: z.string().trim().max(120).optional(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  addressText: z.string().trim().max(240).optional().nullable(),
});

export const ListingFieldsSchema = LocationFieldsSchema.extend({
  title: z.string().trim().min(1, "El título es obligatorio").max(120),
  description: z.string().trim().max(5000).optional(),
  categoryId: z.string().cuid("La categoría no es válida"),
  pricePerDay: z.string().trim().regex(/^\d+(\.\d{1,4})?$/, "El precio no es válido").refine((value) => Number(value) > 0, "El precio debe ser mayor que cero"),
  photos: z.array(PhotoInputSchema).max(10).default([]),
});

export const CreateListingManagementSchema = ListingFieldsSchema.extend({
  publish: z.boolean().default(false),
}).superRefine((value, context) => {
  if (value.publish && value.photos.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["photos"], message: "Añade al menos una imagen para publicar" });
  }
});

export const UpdateListingManagementSchema = ListingFieldsSchema.partial().extend({
  listingId: z.string().cuid(),
});

export const ListingIdSchema = z.object({ listingId: z.string().cuid() });

export const RemoveListingSchema = z.object({
  listingId: z.string().cuid(),
  confirmation: z.literal(true),
});

export const ListMineSchema = z.object({
  status: ListingStatusSchema.optional(),
  query: z.string().trim().max(120).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
});

export const PublishListingSchema = ListingIdSchema;

export type ListingManagementStatus = z.infer<typeof ListingStatusSchema>;
export type CreateListingManagementInput = z.infer<typeof CreateListingManagementSchema>;
export type UpdateListingManagementInput = z.infer<typeof UpdateListingManagementSchema>;
export type ListMineInput = z.infer<typeof ListMineSchema>;
export type RemoveListingInput = z.infer<typeof RemoveListingSchema>;
