import { describe, expect, it } from "vitest";
import { reviewExpirationDate } from "@/features/reviews/application/review-publication.service";

describe("review publication rules", () => {
  it("calculates expiration exactly 14 days after completedAt", () => {
    const completedAt = new Date("2026-01-04T12:00:00.000Z");
    expect(reviewExpirationDate(completedAt)).toEqual(new Date("2026-01-18T12:00:00.000Z"));
  });

  it("does not consider a non-expired review publishable", () => {
    expect(new Date("2026-01-18T11:59:59.000Z") >= reviewExpirationDate(new Date("2026-01-04T12:00:00.000Z"))).toBe(false);
  });
});