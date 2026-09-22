import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Debe usar el formato YYYY-MM-DD");
const idSchema = z.string().trim().min(1).max(100);

export const BookingRequestSchema = z.object({
  listingId: idSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  idempotencyKey: z.string().trim().min(8).max(120),
});

export const BookingAcceptSchema = z.object({ bookingId: idSchema });

export const BookingRejectSchema = z.object({
  bookingId: idSchema,
  reason: z.string().trim().max(500).optional(),
});

export const BookingListSchema = z.object({
  role: z.enum(["renter", "owner", "all"]).default("all"),
  status: z.enum(["pending", "accepted", "rejected", "cancelled", "active", "completed"]).optional(),
  listingId: idSchema.optional(),
  fromDate: dateSchema.optional(),
  toDate: dateSchema.optional(),
  cursor: z.string().trim().min(1).max(200).optional(),
  limit: z.number().int().min(1).max(50).default(20),
}).superRefine((value, context) => {
  if (value.fromDate && value.toDate && value.fromDate > value.toDate) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["toDate"], message: "toDate debe ser posterior o igual a fromDate" });
  }
});

export const BookingGetByIdSchema = z.object({ bookingId: idSchema });

export type BookingRequestInput = z.infer<typeof BookingRequestSchema>;
export type BookingAcceptInput = z.infer<typeof BookingAcceptSchema>;
export type BookingRejectInput = z.infer<typeof BookingRejectSchema>;
export type BookingListInput = z.infer<typeof BookingListSchema>;
