import { createTRPCRouter, authedProcedure, adminProcedure, publicProcedure } from "../trpc";
import { mapErrorToTRPC } from "@/server/lib/errors/map-error";
import { logger } from "@/server/lib/logger";
import { createOwnerReviewSchema, createRenterReviewSchema, getPendingForBookingSchema, reviewReportSchema, reviewResolveReportSchema } from "@/features/reviews/shared/review.schema";
import { z } from "zod";
import { getPublishedListingAggregate, getPublishedUserAggregate } from "@/features/reviews/infrastructure/review.repository";
import { createOwnerReviewService, createRenterReviewService, getOwnerReviewStatusService, getPendingForBookingService, reportReviewService, getPendingReportsService, resolveReportService } from "@/features/reviews/application/review.service";

async function safely<T>(operation: string, userId: string, action: () => Promise<T>) {
  try { return await action(); } catch (error) { logger.error(operation, { error, userId }); throw mapErrorToTRPC(error); }
}

export const reviewRouter = createTRPCRouter({
  createRenterReview: authedProcedure.input(createRenterReviewSchema).mutation(({ ctx, input }) => safely("reviews.createRenterReview", ctx.session.userId, () => createRenterReviewService(ctx.prisma, ctx.session.userId, input))),
  createOwnerReview: authedProcedure.input(createOwnerReviewSchema).mutation(({ ctx, input }) => safely("reviews.createOwnerReview", ctx.session.userId, () => createOwnerReviewService(ctx.prisma, ctx.session.userId, input))),
  getPendingForBooking: authedProcedure.input(getPendingForBookingSchema).query(({ ctx, input }) => safely("reviews.getPendingForBooking", ctx.session.userId, () => getPendingForBookingService(ctx.prisma, ctx.session.userId, input.bookingId))),
  getOwnerReviewStatus: authedProcedure.input(getPendingForBookingSchema).query(({ ctx, input }) => safely("reviews.getOwnerReviewStatus", ctx.session.userId, () => getOwnerReviewStatusService(ctx.prisma, ctx.session.userId, input.bookingId))),
  getListingReputation: publicProcedure.input(z.object({ listingId: z.string().min(1) })).query(({ ctx, input }) => safely("reviews.getListingReputation", "public", () => getPublishedListingAggregate(ctx.prisma, input.listingId))),
  getUserReputation: publicProcedure.input(z.object({ userId: z.string().min(1) })).query(({ ctx, input }) => safely("reviews.getUserReputation", "public", () => getPublishedUserAggregate(ctx.prisma, input.userId))),
  reportReview: authedProcedure.input(reviewReportSchema).mutation(({ ctx, input }) => safely("reviews.reportReview", ctx.session.userId, () => reportReviewService(ctx.prisma, ctx.session.userId, input))),
  getPendingReports: adminProcedure.query(({ ctx }) => safely("reviews.getPendingReports", ctx.session.userId, () => getPendingReportsService(ctx.prisma, ctx.session.role))),
  resolveReport: adminProcedure.input(reviewResolveReportSchema).mutation(({ ctx, input }) => safely("reviews.resolveReport", ctx.session.userId, () => resolveReportService(ctx.prisma, ctx.session.userId, ctx.session.role, input))),
});