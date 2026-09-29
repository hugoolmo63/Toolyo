import { describe, expect, it } from "vitest";
import { resolveAdminReviewReport } from "@/features/admin/application/admin-review.service";

describe("admin audit atomicity", () => {
  it("does not complete a mutation when audit insertion fails", async () => {
    const review = { id: "review", status: "under_review", authorId: "author" };
    const report = { id: "report", reviewId: review.id, status: "open", review };
    const tx = { reviewReport: { findUnique: async () => report, update: async () => report }, review: { update: async () => ({ ...review, status: "removed" }) }, adminAuditLog: { create: async () => { throw new Error("audit unavailable"); } } };
    await expect(resolveAdminReviewReport({ $transaction: async (fn: (value: typeof tx) => unknown) => fn(tx) } as never, "admin", "ADMIN", { reportId: report.id, decision: "removed", resolution: "test" })).rejects.toThrow();
  });
});