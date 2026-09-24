import type { PrismaClient, Prisma } from "@prisma/client";

type ReviewDb = PrismaClient | Prisma.TransactionClient;

export async function listReviewReports(db: ReviewDb, input: { cursor?: string; limit: number; status?: "open" | "resolved" | "dismissed" }) {
  const rows = await db.reviewReport.findMany({ where: input.status ? { status: input.status } : undefined, take: input.limit + 1, ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}), orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { id: true, reviewId: true, reason: true, description: true, status: true, resolution: true, resolvedById: true, createdAt: true, resolvedAt: true, review: { select: { id: true, status: true, overallRating: true, comment: true, listingId: true, authorId: true } }, reporter: { select: { id: true, displayName: true } } } });
  const items = rows.slice(0, input.limit);
  return { items, nextCursor: rows.length > input.limit ? items.at(-1)?.id ?? null : null };
}

export async function getReviewReport(db: ReviewDb, reportId: string) {
  return db.reviewReport.findUnique({ where: { id: reportId }, select: { id: true, reviewId: true, status: true, resolution: true, review: { select: { id: true, status: true, authorId: true } } } });
}