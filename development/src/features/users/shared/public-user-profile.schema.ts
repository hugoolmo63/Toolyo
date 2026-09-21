import { z } from "zod";

export const PublicUserProfileIdSchema = z.string().cuid();
export const ApproximateCoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type ApproximateCoordinates = z.infer<typeof ApproximateCoordinatesSchema>;