import { describe, expect, it } from "vitest";
import { createRenterReviewSchema } from "@/features/reviews/shared/review.schema";

describe("renter review schema", () => {
  const valid = { bookingId: "booking-1", overallRating: 5, categoryScores: [
    { category: "communication", rating: 5 },
    { category: "punctuality", rating: 4 },
    { category: "product_condition", rating: 5 },
  ] };
  it("accepts a complete renter payload", () => expect(createRenterReviewSchema.parse(valid)).toEqual(valid));
  it("rejects ratings outside 1 to 5", () => expect(() => createRenterReviewSchema.parse({ ...valid, overallRating: 6 })).toThrow());
  it("requires the three renter categories", () => expect(() => createRenterReviewSchema.parse({ ...valid, categoryScores: [{ category: "communication", rating: 5 }] })).toThrow());
});