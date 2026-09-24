import { describe, expect, it, vi } from "vitest";
import { reportReviewService } from "@/features/reviews/application/review.service";

function reportDb(review = { id: "review-1", status: "published" as const }) {
  const tx = {
    review: { findUnique: vi.fn().mockResolvedValue(review), update: vi.fn().mockResolvedValue({ ...review, status: "under_review" }) },
    reviewReport: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({ id: "report-1", reviewId: review.id, reporterId: "reporter-1", reason: "offensive", status: "open" }) },
  };
  const db = { ...tx, $transaction: vi.fn((callback: (value: typeof tx) => unknown) => callback(tx)) };
  return { db: db as never, tx };
}

describe("review.report", () => {
  it("creates an active report and flags a published review under review", async () => {
    const { db, tx } = reportDb();
    const result = await reportReviewService(db, "reporter-1", { reviewId: "review-1", reason: "offensive", description: "Contenido ofensivo" });
    expect(result).toMatchObject({ id: "report-1", status: "open" });
    expect(tx.review.update).toHaveBeenCalledWith({ where: { id: "review-1" }, data: { status: "under_review" } });
    expect(tx.reviewReport.create).toHaveBeenCalled();
  });

  it("rejects an equivalent active report from the same user", async () => {
    const { db } = reportDb();
    const duplicateDb = { ...(db as object), reviewReport: { findFirst: vi.fn().mockResolvedValue({ id: "report-1" }) } } as never;
    await expect(reportReviewService(duplicateDb, "reporter-1", { reviewId: "review-1", reason: "offensive" })).rejects.toMatchObject({ code: "conflict" });
  });
});