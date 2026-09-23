import { Prisma, type BookingStatus, type PrismaClient } from "@prisma/client";

export type BookingDb = PrismaClient | Prisma.TransactionClient;

const bookingInclude = {
  listing: { select: { id: true, title: true, slug: true } },
  renter: { select: { id: true, displayName: true } },
  owner: { select: { id: true, displayName: true } },
  conversation: { select: { id: true } },
} as const;

export async function getListing(db: BookingDb, listingId: string) {
  return db.listing.findFirst({
    where: { id: listingId, status: "published", deletedAt: null },
    select: { id: true, ownerId: true, pricePerDay: true, title: true, slug: true },
  });
}

export async function findBookingByIdempotency(db: BookingDb, renterId: string, idempotencyKey: string) {
  return db.booking.findFirst({ where: { renterId, idempotencyKey, deletedAt: null }, include: bookingInclude });
}

export async function findOverlappingBookings(db: BookingDb, listingId: string, startDate: Date, endDate: Date, excludeBookingId?: string) {
  return db.booking.findMany({
    where: {
      listingId,
      deletedAt: null,
      status: { in: ["pending", "accepted", "active"] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
    select: { id: true, status: true, startDate: true, endDate: true },
  });
}

export async function createConversation(db: BookingDb, listingId: string, renterId: string, ownerId: string) {
  return db.conversation.create({
    data: {
      listingId,
      participants: { create: [{ userId: renterId }, { userId: ownerId }] },
    },
    select: { id: true },
  });
}

export async function createBooking(db: BookingDb, data: Prisma.BookingUncheckedCreateInput) {
  return db.booking.create({ data, include: bookingInclude });
}

export async function createStatusHistory(db: BookingDb, data: Prisma.BookingStatusHistoryUncheckedCreateInput) {
  return db.bookingStatusHistory.create({ data });
}

export async function findBookingForActor(db: BookingDb, bookingId: string, userId: string) {
  return db.booking.findFirst({ where: { id: bookingId, deletedAt: null, OR: [{ renterId: userId }, { ownerId: userId }] }, include: bookingInclude });
}

export async function updateBookingStatus(db: BookingDb, bookingId: string, status: BookingStatus, actorId: string, rejectionReason?: string) {
  return db.booking.update({
    where: { id: bookingId },
    data: { status, lastTransitionById: actorId, rejectionReason: rejectionReason ?? null },
    include: bookingInclude,
  });
}

export async function listBookings(db: BookingDb, userId: string, input: { role: "renter" | "owner" | "all"; status?: BookingStatus; listingId?: string; fromDate?: Date; toDate?: Date; limit: number; cursor?: { createdAt: Date; id: string } }) {
  const roleWhere = input.role === "renter" ? { renterId: userId } : input.role === "owner" ? { ownerId: userId } : { OR: [{ renterId: userId }, { ownerId: userId }] };
  return db.booking.findMany({
    where: {
      AND: [
        roleWhere,
        { deletedAt: null },
        ...(input.status ? [{ status: input.status }] : []),
        ...(input.listingId ? [{ listingId: input.listingId }] : []),
        ...(input.fromDate ? [{ endDate: { gt: input.fromDate } }] : []),
        ...(input.toDate ? [{ startDate: { lt: input.toDate } }] : []),
        ...(input.cursor ? [{ OR: [{ createdAt: { lt: input.cursor.createdAt } }, { createdAt: input.cursor.createdAt, id: { lt: input.cursor.id } }] }] : []),
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: input.limit + 1,
    include: bookingInclude,
  });
}
