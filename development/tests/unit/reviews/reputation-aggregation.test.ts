import { describe, expect, it } from "vitest";
import { aggregatePublishedReviews } from "@/features/reviews/infrastructure/review.repository";

describe("public reputation aggregation", () => {
  it("rounds averages to one decimal and excludes unpublished reviews", () => {
    const result = aggregatePublishedReviews([
      { overallRating: 5, categoryScores: [{ category: "communication", rating: 5 }] },
      { overallRating: 4, categoryScores: [{ category: "communication", rating: 4 }] },
      { overallRating: 4, categoryScores: [{ category: "communication", rating: 4 }] },
    ]);
    expect(result.averageRating).toBe(4.3);
    expect(result.reviewCount).toBe(3);
    expect(result.categories).toEqual([{ category: "communication", averageRating: 4.3, reviewCount: 3 }]);
  });

  it("returns null average and no categories when no published review is selected", () => {
    expect(aggregatePublishedReviews([])).toEqual({ averageRating: null, reviewCount: 0, categories: [] });
  });

  it("aggregates each category independently and rounds to one decimal", () => {
    const result = aggregatePublishedReviews([
      { overallRating: 3, categoryScores: [{ category: "communication", rating: 3 }, { category: "care", rating: 5 }] },
      { overallRating: 4, categoryScores: [{ category: "communication", rating: 4 }, { category: "care", rating: 4 }] },
    ]);
    expect(result.averageRating).toBe(3.5);
    expect(result.categories).toEqual([
      { category: "care", averageRating: 4.5, reviewCount: 2 },
      { category: "communication", averageRating: 3.5, reviewCount: 2 },
    ]);
  });
});