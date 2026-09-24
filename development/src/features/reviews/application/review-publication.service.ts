import type { PrismaClient } from "@prisma/client";
import type { ReviewDb } from "../infrastructure/review.repository";

const REVIEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export function reviewExpirationDate(completedAt: Date) {
  return new Date(completedAt.getTime() + REVIEW_WINDOW_MS);
}

async function publishBookingReviewsInTransaction(db: ReviewDb, bookingId: string, publishedAt: Date) {
  const pending = await db.review.findMany({
    where: { bookingId, status: "hidden", deletedAt: null },
    select: { id: true },
  });
  if (pending.length < 2) return 0;
  const result = await db.review.updateMany({
    where: { bookingId, status: "hidden", deletedAt: null },
    data: { status: "published", publishedAt },
  });
  return result.count;
}

/** Publishes both sides together once the counterpart review exists. */
export async function publishBookingReviews(db: PrismaClient, bookingId: string, publishedAt = new Date()) {
  return db.$transaction((tx) => publishBookingReviewsInTransaction(tx, bookingId, publishedAt).then((published) => ({ published })));
}

export { publishBookingReviewsInTransaction };