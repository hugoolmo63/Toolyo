import type { PrismaClient } from "@prisma/client";
import { ConflictError, ForbiddenError, NotFoundError } from "@/server/lib/errors/domain-errors";
import { assertBookingParticipant } from "./review-authorization";
import { assertReviewEligible } from "../domain/review-eligibility";
import { isReviewCategoryAllowed } from "../domain/review";
import { ReviewCategoryError, ReviewDuplicateError } from "../domain/review-errors";
import { assertModerator } from "./review-authorization";
import { createOwnerReview, createRenterReview, findBookingForReview, findOwnerReview, findRenterReview, findReviewForModeration, findActiveReviewReport, createReviewReport, flagReviewUnderReview, findPendingReviewReports, findReviewReport } from "../infrastructure/review.repository";
import type { ReviewSubmitInput } from "../shared/review.schema";
import { publishBookingReviewsInTransaction, reviewExpirationDate } from "./review-publication.service";

function mapReview(review: Awaited<ReturnType<typeof createRenterReview>>) {
  return {
    id: review.id,
    bookingId: review.bookingId,
    direction: review.direction,
    status: review.status,
    overallRating: review.overallRating,
    comment: review.comment,
    categoryScores: review.categoryScores.map((score) => ({ category: score.category, rating: score.rating })),
    submittedAt: review.submittedAt.toISOString(),
    publishedAt: review.publishedAt?.toISOString() ?? null,
  };
}

export async function createRenterReviewService(db: PrismaClient, renterId: string, input: ReviewSubmitInput) {
  const booking = await findBookingForReview(db, input.bookingId);
  if (!booking) throw new NotFoundError("Reserva no encontrada");
  assertBookingParticipant(renterId, booking.renterId, booking.ownerId);
  if (booking.renterId !== renterId) throw new ForbiddenError("Solo el arrendatario puede crear esta review");
  assertReviewEligible(booking.status, booking.completedAt);

  const existing = await findRenterReview(db, booking.id, renterId);
  if (existing) throw new ReviewDuplicateError();

  const categories = new Set<string>();
  for (const score of input.categoryScores) {
    if (!isReviewCategoryAllowed("renter_to_owner", score.category) || categories.has(score.category)) {
      throw new ReviewCategoryError();
    }
    categories.add(score.category);
  }
  const requiredCategories = ["communication", "punctuality", "product_condition"];
  if (categories.size !== requiredCategories.length || requiredCategories.some((category) => !categories.has(category))) {
    throw new ReviewCategoryError();
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const review = await createRenterReview(tx, {
      bookingId: booking.id,
      listingId: booking.listingId,
      authorId: renterId,
      revieweeId: booking.ownerId,
      overallRating: input.overallRating,
      comment: input.comment,
      expiresAt: reviewExpirationDate(booking.completedAt!),
      categoryScores: input.categoryScores,
      });
      const publishedAt = new Date();
      const published = await publishBookingReviewsInTransaction(tx, booking.id, publishedAt);
      return { review: published === 2 ? { ...review, status: "published" as const, publishedAt } : review, published };
    });
    return { ...mapReview(result.review), publicationReason: result.published === 2 ? "both_reviews_submitted" as const : "awaiting_other_review" as const };
  } catch (error) {
    if (error instanceof ReviewDuplicateError) throw error;
    if ((error as { code?: string }).code === "P2002") throw new ConflictError("La review ya existe");
    throw error;
  }
}

export async function createOwnerReviewService(db: PrismaClient, ownerId: string, input: ReviewSubmitInput) {
  const booking = await findBookingForReview(db, input.bookingId);
  if (!booking) throw new NotFoundError("Reserva no encontrada");
  assertBookingParticipant(ownerId, booking.renterId, booking.ownerId);
  if (booking.ownerId !== ownerId) throw new ForbiddenError("Solo el propietario puede crear esta review");
  assertReviewEligible(booking.status, booking.completedAt);
  if (await findOwnerReview(db, booking.id, ownerId)) throw new ReviewDuplicateError();
  const allowed = ["communication", "punctuality", "product_care"];
  const categories = new Set(input.categoryScores.map((score) => score.category));
  if (categories.size !== 3 || allowed.some((category) => !categories.has(category)) || input.categoryScores.some((score) => !isReviewCategoryAllowed("owner_to_renter", score.category))) throw new ReviewCategoryError();
  try {
    const result = await db.$transaction(async (tx) => {
      const review = await createOwnerReview(tx, { bookingId: booking.id, listingId: booking.listingId, authorId: ownerId, revieweeId: booking.renterId, overallRating: input.overallRating, comment: input.comment, expiresAt: reviewExpirationDate(booking.completedAt!), categoryScores: input.categoryScores });
      const publishedAt = new Date();
      const published = await publishBookingReviewsInTransaction(tx, booking.id, publishedAt);
      return { review: published === 2 ? { ...review, status: "published" as const, publishedAt } : review, published };
    });
    return { ...mapReview(result.review), publicationReason: result.published === 2 ? "both_reviews_submitted" as const : "awaiting_other_review" as const };
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") throw new ConflictError("La review ya existe");
    throw error;
  }
}

export async function getOwnerReviewStatusService(db: PrismaClient, ownerId: string, bookingId: string) {
  const booking = await findBookingForReview(db, bookingId);
  if (!booking) throw new NotFoundError("Reserva no encontrada");
  if (booking.ownerId !== ownerId) throw new ForbiddenError("Solo el propietario puede consultar esta review");
  const review = await findOwnerReview(db, bookingId, ownerId);
  const eligible = (() => { try { assertReviewEligible(booking.status, booking.completedAt); return true; } catch { return false; } })();
  return { bookingId, listing: booking.listing, eligible, status: review?.status ?? "pending", review: review ? mapReview(review as Awaited<ReturnType<typeof createRenterReview>>) : null };
}

export async function getPendingForBookingService(db: PrismaClient, renterId: string, bookingId: string) {
  const booking = await findBookingForReview(db, bookingId);
  if (!booking) throw new NotFoundError("Reserva no encontrada");
  if (booking.renterId !== renterId) throw new ForbiddenError("Solo el arrendatario puede consultar esta review");
  const review = await findRenterReview(db, bookingId, renterId);
  const eligible = (() => {
    try { assertReviewEligible(booking.status, booking.completedAt); return true; } catch { return false; }
  })();
  return {
    bookingId: booking.id,
    listing: booking.listing,
    eligible,
    status: review?.status ?? "pending",
    review: review ? mapReview(review as Awaited<ReturnType<typeof createRenterReview>>) : null,
  };
}

type ReportInput = { reviewId: string; reason: "offensive" | "inappropriate" | "false" | "irrelevant"; description?: string };
type ResolveInput = { reportId: string; decision: "published" | "removed"; resolution: string };

export async function reportReviewService(db: PrismaClient, reporterId: string, input: ReportInput) {
  const review = await findReviewForModeration(db, input.reviewId);
  if (!review) throw new NotFoundError("Review no encontrada");
  if (review.status === "removed") throw new ConflictError("La review ya no está disponible");
  if (await findActiveReviewReport(db, { reviewId: input.reviewId, reporterId, reason: input.reason })) throw new ConflictError("Ya existe un reporte activo equivalente");
  try {
    return await db.$transaction(async (tx) => {
      const report = await createReviewReport(tx, { ...input, reporterId });
      if (review.status === "published") await flagReviewUnderReview(tx, review.id);
      return report;
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") throw new ConflictError("Ya existe un reporte activo equivalente");
    throw error;
  }
}

export async function getPendingReportsService(db: PrismaClient, role: "user" | "admin" | "ADMIN" | "MODERATOR") {
  assertModerator(role);
  return findPendingReviewReports(db);
}

export async function resolveReportService(db: PrismaClient, moderatorId: string, role: "user" | "admin" | "ADMIN" | "MODERATOR", input: ResolveInput) {
  assertModerator(role);
  const report = await findReviewReport(db, input.reportId);
  if (!report || report.status !== "open") throw new NotFoundError("Reporte pendiente no encontrado");
  if (report.review.status !== "under_review") throw new ConflictError("La review no está pendiente de moderación");
  return db.$transaction(async (tx) => {
    const review = await tx.review.update({ where: { id: report.reviewId }, data: { status: input.decision, deletedAt: input.decision === "removed" ? new Date() : null } });
    await tx.reviewReport.update({ where: { id: report.id }, data: { status: "resolved", resolution: input.resolution, resolvedById: moderatorId, resolvedAt: new Date() } });
    return { reportId: report.id, reviewStatus: review.status, resolution: input.resolution };
  });
}