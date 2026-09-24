import type { PrismaClient } from "@prisma/client";

/** Idempotently publishes reviews whose blind-review window has expired. */
export async function publishExpiredReviews(db: PrismaClient, now = new Date()) {
  const result = await db.review.updateMany({
    where: { status: "hidden", expiresAt: { lte: now }, deletedAt: null },
    data: { status: "published", publishedAt: now },
  });
  return result.count;
}

export default publishExpiredReviews;