import { describe, expect, it, vi } from "vitest";
import { getPendingReportsService, resolveReportService } from "@/features/reviews/application/review.service";

function moderationDb(decisionResult: "published" | "removed") {
  const report = { id: "report-1", reviewId: "review-1", status: "open", review: { id: "review-1", status: "under_review" } };
  const tx = {
    reviewReport: { findMany: vi.fn().mockResolvedValue([report]), findUnique: vi.fn().mockResolvedValue(report), update: vi.fn().mockResolvedValue({ ...report, status: "resolved", resolution: "Revisado", resolvedById: "admin-1" }) },
    review: { update: vi.fn().mockResolvedValue({ id: "review-1", status: decisionResult, deletedAt: decisionResult === "removed" ? new Date() : null }) },
  };
  const db = { ...tx, $transaction: vi.fn((callback: (value: typeof tx) => unknown) => callback(tx)) };
  return { db: db as never, tx };
}

describe("review moderation", () => {
  it("lists pending reports only for an administrator", async () => {
    const { db } = moderationDb("published");
    await expect(getPendingReportsService(db, "user")).rejects.toMatchObject({ code: "forbidden" });
    expect(await getPendingReportsService(db, "admin")).toHaveLength(1);
  });

  it("resolves a report to published and preserves the review", async () => {
    const { db, tx } = moderationDb("published");
    const result = await resolveReportService(db, "admin-1", "admin", { reportId: "report-1", decision: "published", resolution: "No incumplimiento" });
    expect(result.reviewStatus).toBe("published");
    expect(tx.review.update).toHaveBeenCalledWith({ where: { id: "review-1" }, data: { status: "published", deletedAt: null } });
    expect(tx.reviewReport.update).toHaveBeenCalled();
  });

  it("resolves a report to removed with a soft delete", async () => {
    const { db, tx } = moderationDb("removed");
    const result = await resolveReportService(db, "admin-1", "admin", { reportId: "report-1", decision: "removed", resolution: "Incumplimiento confirmado" });
    expect(result.reviewStatus).toBe("removed");
    expect(tx.review.update).toHaveBeenCalledWith({ where: { id: "review-1" }, data: { status: "removed", deletedAt: expect.any(Date) } });
  });
});