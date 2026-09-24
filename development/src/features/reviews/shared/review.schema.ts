import { z } from "zod";

const categoryScore = z.object({ category: z.string().min(1).max(64), rating: z.number().int().min(1).max(5) });

const reviewSubmitBaseSchema = z.object({
  bookingId: z.string().min(1),
  overallRating: z.number().int().min(1).max(5),
  categoryScores: z.array(categoryScore).min(1).max(4),
  comment: z.string().trim().max(5000).optional(),
});

export const reviewSubmitSchema = reviewSubmitBaseSchema.superRefine((value, context) => {
  const categories = value.categoryScores.map((score) => score.category);
  const required = ["communication", "punctuality", "product_condition"];
  if (categories.length !== 3 || new Set(categories).size !== 3 || required.some((category) => !categories.includes(category))) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["categoryScores"], message: "La review del renter requiere Comunicación, Puntualidad y Estado del producto" });
  }
});

export const createRenterReviewSchema = reviewSubmitSchema;
export const createOwnerReviewSchema = reviewSubmitBaseSchema.superRefine((value, context) => {
  const categories = value.categoryScores.map((score) => score.category);
  const required = ["communication", "punctuality", "product_care"];
  if (categories.length !== 3 || new Set(categories).size !== 3 || required.some((category) => !categories.includes(category))) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["categoryScores"], message: "La review del owner requiere Comunicación, Puntualidad y Cuidado del producto" });
  }
});
export const getPendingForBookingSchema = z.object({ bookingId: z.string().trim().min(1).max(100) });

export const reviewParticipantSchema = z.object({ bookingId: z.string().min(1) });
export const reviewReputationListingSchema = z.object({ listingId: z.string().min(1) });
export const reviewReputationUserSchema = z.object({ userId: z.string().min(1) });
export const reviewReportSchema = z.object({
  reviewId: z.string().min(1),
  reason: z.enum(["offensive", "inappropriate", "false", "irrelevant"]),
  description: z.string().trim().max(5000).optional(),
});
export const reviewResolveReportSchema = z.object({
  reportId: z.string().min(1),
  decision: z.enum(["published", "removed"]),
  resolution: z.string().trim().min(1).max(5000),
});

export type ReviewSubmitInput = z.infer<typeof reviewSubmitSchema>;
