import { describe, expect, it, vi } from "vitest";
import { appRouter } from "@/server/api/root";

function callerWithReviews(reviews: unknown[]) {
  const prisma = { review: { findMany: vi.fn().mockResolvedValue(reviews) } } as never;
  return appRouter.createCaller({
    prisma,
    session: null,
    sessionToken: null,
    pendingCookies: [],
    setCookie: () => undefined,
    clientIp: "127.0.0.1",
  });
}

const publishedReview = (overallRating: number, category = "communication") => ({
  overallRating,
  categoryScores: [{ category, rating: overallRating }],
});

describe("public reputation procedures", () => {
  it("returns the published listing aggregate", async () => {
    const caller = callerWithReviews([publishedReview(5), publishedReview(4)]);
    const reputation = await caller.reviews.getListingReputation({ listingId: "listing-1" });
    expect(reputation).toEqual({
      averageRating: 4.5,
      reviewCount: 2,
      categories: [{ category: "communication", averageRating: 4.5, reviewCount: 2 }],
    });
  });

  it("returns the published user aggregate", async () => {
    const caller = callerWithReviews([publishedReview(3, "punctuality")]);
    const reputation = await caller.reviews.getUserReputation({ userId: "user-1" });
    expect(reputation.averageRating).toBe(3);
    expect(reputation.reviewCount).toBe(1);
    expect(reputation.categories[0]?.category).toBe("punctuality");
  });
});