import { describe, expect, it, vi } from "vitest";
import { getPublishedListingAggregate, getPublishedUserAggregate } from "@/features/reviews/infrastructure/review.repository";

function databaseReturningOnlyPublishedRows(rows: unknown[]) {
  const findMany = vi.fn().mockResolvedValue(rows);
  return { db: { review: { findMany } } as never, findMany };
}

describe("public reputation privacy", () => {
  it("does not count hidden or under_review reviews in listing reputation", async () => {
    const { db, findMany } = databaseReturningOnlyPublishedRows([{ overallRating: 5, categoryScores: [{ category: "communication", rating: 5 }] }]);
    const reputation = await getPublishedListingAggregate(db, "listing-1");
    expect(reputation.reviewCount).toBe(1);
    expect(reputation.averageRating).toBe(5);
    expect(findMany.mock.calls[0]?.[0].where).toEqual({ listingId: "listing-1", status: "published", deletedAt: null });
  });

  it("uses revieweeId and the published filter for user reputation", async () => {
    const { db, findMany } = databaseReturningOnlyPublishedRows([{ overallRating: 4, categoryScores: [] }]);
    const reputation = await getPublishedUserAggregate(db, "user-1");
    expect(reputation).toMatchObject({ averageRating: 4, reviewCount: 1 });
    expect(findMany.mock.calls[0]?.[0].where).toEqual({ revieweeId: "user-1", status: "published", deletedAt: null });
  });
});