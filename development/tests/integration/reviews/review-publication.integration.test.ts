import { describe, expect, it, vi } from "vitest";
import { publishExpiredReviews } from "@/server/jobs/publish-expired-reviews";
import { publishBookingReviews } from "@/features/reviews/application/review-publication.service";

describe("review double-blind publication", () => {
  it("keeps the first review hidden and publishes both atomically after the counterpart arrives", async () => {
    const now = new Date("2026-01-10T12:00:00.000Z");
    const current = { id: "review-renter", status: "hidden" as const };
    const counterpart = { id: "review-owner", status: "hidden" as const };
    const tx = {
      review: {
        findMany: vi.fn().mockResolvedValue([current, counterpart]),
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const db = { $transaction: vi.fn((callback: (value: typeof tx) => unknown) => callback(tx)) } as never;
    const result = await publishBookingReviews(db, "booking-1", now);
    expect(result.published).toBe(2);
    expect(tx.review.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { bookingId: "booking-1", status: "hidden", deletedAt: null }, data: { status: "published", publishedAt: now } }));
  });

  it("publishes expired hidden reviews and is idempotent", async () => {
    const updateMany = vi.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const db = { review: { updateMany } } as never;
    const now = new Date("2026-01-19T00:00:00.000Z");
    expect(await publishExpiredReviews(db, now)).toBe(1);
    expect(await publishExpiredReviews(db, now)).toBe(0);
    expect(updateMany).toHaveBeenCalledWith({ where: { status: "hidden", expiresAt: { lte: now }, deletedAt: null }, data: { status: "published", publishedAt: now } });
  });
});