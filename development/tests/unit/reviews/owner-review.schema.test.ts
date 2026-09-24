import { describe, expect, it } from "vitest";
import { createOwnerReviewSchema } from "@/features/reviews/shared/review.schema";

const valid = { bookingId: "booking-1", overallRating: 4, categoryScores: [{ category: "communication", rating: 4 }, { category: "punctuality", rating: 5 }, { category: "product_care", rating: 4 }] };

describe("owner review schema", () => {
  it("accepts owner categories", () => expect(createOwnerReviewSchema.parse(valid)).toEqual(valid));
  it("rejects renter product_condition category", () => expect(() => createOwnerReviewSchema.parse({ ...valid, categoryScores: [{ category: "communication", rating: 4 }, { category: "punctuality", rating: 5 }, { category: "product_condition", rating: 4 }] })).toThrow());
});