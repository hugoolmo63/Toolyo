import { Prisma, type PrismaClient } from "@prisma/client";

export type ReviewDb = PrismaClient | Prisma.TransactionClient;

export async function findBookingForReview(db: ReviewDb, bookingId: string) {
  return db.booking.findUnique({
    where: { id: bookingId, deletedAt: null },
    select: {
      id: true,
      listingId: true,
      renterId: true,
      ownerId: true,
      status: true,
      completedAt: true,
      listing: { select: { id: true, title: true, slug: true } },
    },
  });
}

export async function findRenterReview(db: ReviewDb, bookingId: string, renterId: string) {
  return db.review.findFirst({
    where: { bookingId, authorId: renterId, direction: "renter_to_owner", deletedAt: null },
    include: { categoryScores: true },
  });
}

export async function findOwnerReview(db: ReviewDb, bookingId: string, ownerId: string) {
  return db.review.findFirst({ where: { bookingId, authorId: ownerId, direction: "owner_to_renter", deletedAt: null }, include: { categoryScores: true } });
}

export async function createRenterReview(
  db: ReviewDb,
  input: { bookingId: string; listingId: string; authorId: string; revieweeId: string; overallRating: number; comment?: string; expiresAt: Date; categoryScores: Array<{ category: string; rating: number }> },
) {
  return db.review.create({
    data: {
      bookingId: input.bookingId,
      listingId: input.listingId,
      authorId: input.authorId,
      revieweeId: input.revieweeId,
      direction: "renter_to_owner",
      status: "hidden",
      expiresAt: input.expiresAt,
      rating: input.overallRating,
      overallRating: input.overallRating,
      comment: input.comment || null,
      categoryScores: { create: input.categoryScores },
    },
    include: { categoryScores: true },
  });
}

export async function createOwnerReview(db: ReviewDb, input: { bookingId: string; listingId: string; authorId: string; revieweeId: string; overallRating: number; comment?: string; expiresAt: Date; categoryScores: Array<{ category: string; rating: number }> }) {
  return db.review.create({
    data: { bookingId: input.bookingId, listingId: input.listingId, authorId: input.authorId, revieweeId: input.revieweeId, direction: "owner_to_renter", status: "hidden", expiresAt: input.expiresAt, rating: input.overallRating, overallRating: input.overallRating, comment: input.comment || null, categoryScores: { create: input.categoryScores } },
    include: { categoryScores: true },
  });
}

export async function getPublishedListingAggregate(db: ReviewDb, listingId: string) {
  const reviews = await db.review.findMany({ where: { listingId, status: "published", deletedAt: null }, select: { overallRating: true, categoryScores: { select: { category: true, rating: true } } } });
  return aggregatePublishedReviews(reviews);
}

export async function getPublishedUserAggregate(db: ReviewDb, userId: string) {
  const reviews = await db.review.findMany({ where: { revieweeId: userId, status: "published", deletedAt: null }, select: { overallRating: true, categoryScores: { select: { category: true, rating: true } } } });
  return aggregatePublishedReviews(reviews);
}

export async function findReviewForModeration(db: ReviewDb, reviewId: string) {
  return db.review.findUnique({ where: { id: reviewId, deletedAt: null }, select: { id: true, status: true } });
}

export async function findActiveReviewReport(db: ReviewDb, input: { reviewId: string; reporterId: string; reason: "offensive" | "inappropriate" | "false" | "irrelevant" }) {
  return db.reviewReport.findFirst({ where: { reviewId: input.reviewId, reporterId: input.reporterId, reason: input.reason, status: "open" } });
}

export async function createReviewReport(db: ReviewDb, input: { reviewId: string; reporterId: string; reason: "offensive" | "inappropriate" | "false" | "irrelevant"; description?: string }) {
  return db.reviewReport.create({ data: { reviewId: input.reviewId, reporterId: input.reporterId, reason: input.reason, description: input.description || null } });
}

export async function flagReviewUnderReview(db: ReviewDb, reviewId: string) {
  return db.review.update({ where: { id: reviewId }, data: { status: "under_review" } });
}

export async function findPendingReviewReports(db: ReviewDb) {
  return db.reviewReport.findMany({ where: { status: "open" }, orderBy: { createdAt: "asc" }, include: { review: { select: { id: true, status: true, overallRating: true, comment: true, listingId: true, authorId: true } }, reporter: { select: { id: true, displayName: true } } } });
}

export async function findReviewReport(db: ReviewDb, reportId: string) {
  return db.reviewReport.findUnique({ where: { id: reportId }, include: { review: { select: { id: true, status: true } } } });
}

export type PublishedReviewAggregate = {
  averageRating: number | null;
  reviewCount: number;
  categories: Array<{ category: string; averageRating: number; reviewCount: number }>;
};

export function aggregatePublishedReviews(reviews: Array<{ overallRating: number; categoryScores: Array<{ category: string; rating: number }> }>): PublishedReviewAggregate {
  const round = (value: number) => Math.round(value * 10) / 10;
  const categoryTotals = new Map<string, { total: number; count: number }>();
  for (const review of reviews) for (const score of review.categoryScores) {
    const current = categoryTotals.get(score.category) ?? { total: 0, count: 0 };
    categoryTotals.set(score.category, { total: current.total + score.rating, count: current.count + 1 });
  }
  return {
    averageRating: reviews.length ? round(reviews.reduce((total, review) => total + review.overallRating, 0) / reviews.length) : null,
    reviewCount: reviews.length,
    categories: Array.from(categoryTotals, ([category, value]) => ({ category, averageRating: round(value.total / value.count), reviewCount: value.count })).sort((a, b) => a.category.localeCompare(b.category)),
  };
}