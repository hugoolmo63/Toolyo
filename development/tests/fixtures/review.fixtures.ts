import { Prisma, type PrismaClient } from "@prisma/client";

type ReviewDb = PrismaClient | Prisma.TransactionClient;

export function completedBookingFixture(overrides: Partial<Prisma.BookingUncheckedCreateInput> = {}): Prisma.BookingUncheckedCreateInput {
  return {
    id: overrides.id ?? "review-fixture-booking",
    listingId: overrides.listingId ?? "fixture-listing",
    renterId: overrides.renterId ?? "fixture-renter",
    ownerId: overrides.ownerId ?? "fixture-owner",
    conversationId: overrides.conversationId ?? "review-fixture-conversation",
    startDate: overrides.startDate ?? new Date("2026-01-01T00:00:00.000Z"),
    endDate: overrides.endDate ?? new Date("2026-01-04T00:00:00.000Z"),
    status: "completed",
    completedAt: overrides.completedAt ?? new Date("2026-01-04T12:00:00.000Z"),
    pricePerDay: overrides.pricePerDay ?? new Prisma.Decimal("25.0000"),
    totalDays: overrides.totalDays ?? 3,
    subtotal: overrides.subtotal ?? new Prisma.Decimal("75.0000"),
    serviceFee: overrides.serviceFee ?? new Prisma.Decimal("7.5000"),
    totalPrice: overrides.totalPrice ?? new Prisma.Decimal("82.5000"),
    currencyCode: overrides.currencyCode ?? "EUR",
    idempotencyKey: overrides.idempotencyKey ?? "review-fixture-booking",
  };
}

export async function createReviewFixture(db: ReviewDb, overrides: Partial<Prisma.ReviewUncheckedCreateInput> = {}) {
  return db.review.create({
    data: {
      id: overrides.id ?? "review-fixture-review",
      bookingId: overrides.bookingId ?? "review-fixture-booking",
      listingId: overrides.listingId ?? "fixture-listing",
      authorId: overrides.authorId ?? "fixture-renter",
      revieweeId: overrides.revieweeId ?? "fixture-owner",
      direction: overrides.direction ?? "renter_to_owner",
      status: overrides.status ?? "hidden",
      rating: overrides.rating ?? overrides.overallRating ?? 5,
      overallRating: overrides.overallRating ?? overrides.rating ?? 5,
      comment: overrides.comment,
    },
  });
}