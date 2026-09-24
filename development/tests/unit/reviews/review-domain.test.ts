import { describe, expect, it } from "vitest";
import { assertCompletedAtImmutable, assertReviewEligible, reviewWindowExpired } from "@/features/reviews/domain/review-eligibility";
import { canTransitionReview, isReviewCategoryAllowed } from "@/features/reviews/domain/review";
import { assertModerator } from "@/features/reviews/application/review-authorization";
import { reviewReportSchema, reviewResolveReportSchema } from "@/features/reviews/shared/review.schema";

describe("review domain", () => {
  const completedAt = new Date("2026-01-01T00:00:00.000Z");

  it("accepts a completed booking inside the 14-day window", () => {
    expect(assertReviewEligible("completed", completedAt, new Date("2026-01-10T00:00:00.000Z"))).toEqual(new Date("2026-01-15T00:00:00.000Z"));
  });
  it("rejects expired windows", () => {
    expect(reviewWindowExpired(completedAt, new Date("2026-01-15T00:00:00.000Z"))).toBe(true);
  });
  it("enforces direction categories and transitions", () => {
    expect(isReviewCategoryAllowed("renter_to_owner", "product_condition")).toBe(true);
    expect(isReviewCategoryAllowed("owner_to_renter", "product_condition")).toBe(false);
    expect(canTransitionReview("published", "under_review")).toBe(true);
    expect(canTransitionReview("hidden", "removed")).toBe(false);
  });
  it("enforces moderation transitions and authorization", () => {
    expect(canTransitionReview("published", "under_review")).toBe(true);
    expect(canTransitionReview("under_review", "published")).toBe(true);
    expect(canTransitionReview("under_review", "removed")).toBe(true);
    expect(canTransitionReview("published", "removed")).toBe(false);
    expect(() => assertModerator("user")).toThrow("Se requiere rol de moderación");
    expect(() => assertModerator("admin")).not.toThrow();
  });
  it("validates moderation reasons and resolutions", () => {
    expect(reviewReportSchema.parse({ reviewId: "review-1", reason: "offensive" }).reason).toBe("offensive");
    expect(() => reviewReportSchema.parse({ reviewId: "review-1", reason: "spam" })).toThrow();
    expect(reviewResolveReportSchema.parse({ reportId: "report-1", decision: "removed", resolution: "Confirmado" }).decision).toBe("removed");
  });
  it("rejects completedAt changes", () => {
    expect(() => assertCompletedAtImmutable(completedAt, new Date("2026-01-02T00:00:00.000Z"))).toThrow();
  });
});