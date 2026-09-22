import { Prisma, type PrismaClient } from "@prisma/client";

type Database = PrismaClient | Prisma.TransactionClient;

export async function createBookingFixture(
  db: Database,
  overrides: Partial<Prisma.BookingUncheckedCreateInput> = {},
) {
  const conversationId = overrides.conversationId ?? "fixture-conversation-booking";
  const listingId = overrides.listingId ?? "fixture-listing";
  const renterId = overrides.renterId ?? "fixture-renter";
  const ownerId = overrides.ownerId ?? "fixture-owner";

  return db.booking.create({
    data: {
      id: overrides.id ?? "fixture-booking",
      listingId,
      renterId,
      ownerId,
      conversationId,
      startDate: overrides.startDate ?? new Date("2030-06-01T00:00:00.000Z"),
      endDate: overrides.endDate ?? new Date("2030-06-04T00:00:00.000Z"),
      status: overrides.status ?? "pending",
      pricePerDay: overrides.pricePerDay ?? new Prisma.Decimal("25.0000"),
      totalDays: overrides.totalDays ?? 3,
      subtotal: overrides.subtotal ?? new Prisma.Decimal("75.0000"),
      serviceFee: overrides.serviceFee ?? new Prisma.Decimal("7.5000"),
      totalPrice: overrides.totalPrice ?? new Prisma.Decimal("82.5000"),
      currencyCode: overrides.currencyCode ?? "EUR",
      idempotencyKey: overrides.idempotencyKey ?? "fixture-booking-request",
      rejectionReason: overrides.rejectionReason,
      lastTransitionById: overrides.lastTransitionById,
      deletedAt: overrides.deletedAt,
    },
  });
}
