import { Prisma, type PrismaClient } from "@prisma/client";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../domain/booking-errors";
import { BookingAvailabilityConflictError, InvalidBookingStateError } from "../domain/booking-errors";
import { assertValidDateRange, parseCalendarDate } from "../domain/date-range";
import { calculateFinancialBreakdown } from "../domain/financial-breakdown";
import type { BookingAcceptInput, BookingListInput, BookingRejectInput, BookingRequestInput } from "../shared/booking.schema";
import { createBooking, createConversation, createStatusHistory, findBookingByIdempotency, findBookingForActor, findOverlappingBookings, getListing, listBookings, updateBookingStatus } from "../infrastructure/booking.repository";
import { findListingConversation } from "@/features/messaging/infrastructure/messaging.repository";

const SERVICE_FEE_RATE = new Prisma.Decimal("0.10");

function mapBooking(row: Awaited<ReturnType<typeof createBooking>>) {
  return {
    id: row.id,
    listingId: row.listingId,
    renterId: row.renterId,
    ownerId: row.ownerId,
    conversationId: row.conversationId,
    startDate: row.startDate.toISOString().slice(0, 10),
    endDate: row.endDate.toISOString().slice(0, 10),
    status: row.status,
    financials: {
      pricePerDay: row.pricePerDay.toString(),
      totalDays: row.totalDays,
      subtotal: row.subtotal.toString(),
      serviceFee: row.serviceFee.toString(),
      totalPrice: row.totalPrice.toString(),
      currencyCode: row.currencyCode,
    },
    rejectionReason: row.rejectionReason,
    listing: row.listing,
    renter: row.renter,
    owner: row.owner,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function requestBooking(db: PrismaClient, renterId: string, input: BookingRequestInput) {
  const existing = await findBookingByIdempotency(db, renterId, input.idempotencyKey);
  if (existing) return { ...mapBooking(existing as Awaited<ReturnType<typeof createBooking>>), deduplicated: true };

  const startDate = parseCalendarDate(input.startDate);
  const endDate = parseCalendarDate(input.endDate);
  assertValidDateRange({ startDate, endDate });

  return db.$transaction(async (tx) => {
    const listing = await getListing(tx, input.listingId);
    if (!listing) throw new NotFoundError("Listing no encontrado o no disponible");
    if (listing.ownerId === renterId) throw new ForbiddenError("No puedes reservar tu propio listing");

    const overlap = await findOverlappingBookings(tx, listing.id, startDate, endDate);
    if (overlap.length > 0) throw new BookingAvailabilityConflictError();

    const financials = calculateFinancialBreakdown(listing.pricePerDay, { startDate, endDate }, SERVICE_FEE_RATE);
    const conversation =
      (await findListingConversation(tx, listing.id, renterId, listing.ownerId)) ??
      (await createConversation(tx, listing.id, renterId, listing.ownerId));
    const booking = await createBooking(tx, {
      listingId: listing.id,
      renterId,
      ownerId: listing.ownerId,
      conversationId: conversation.id,
      startDate,
      endDate,
      status: "pending",
      pricePerDay: financials.pricePerDay,
      totalDays: financials.totalDays,
      subtotal: financials.subtotal,
      serviceFee: financials.serviceFee,
      totalPrice: financials.totalPrice,
      currencyCode: financials.currencyCode,
      idempotencyKey: input.idempotencyKey,
    });
    await createStatusHistory(tx, { bookingId: booking.id, fromStatus: null, toStatus: "pending", changedById: renterId, reason: "Solicitud de reserva" });
    return { ...mapBooking(booking), deduplicated: false };
  });
}

async function transitionBooking(db: PrismaClient, actorId: string, bookingId: string, next: "accepted" | "rejected", reason?: string) {
  return db.$transaction(async (tx) => {
    const booking = await findBookingForActor(tx, bookingId, actorId);
    if (!booking) throw new NotFoundError("Reserva no encontrada");
    if (booking.ownerId !== actorId) throw new ForbiddenError("Solo el owner puede resolver esta reserva");
    if (booking.status !== "pending") throw new InvalidBookingStateError();

    if (next === "accepted") {
      const overlap = await findOverlappingBookings(tx, booking.listingId, booking.startDate, booking.endDate, booking.id);
      if (overlap.some((item) => item.status === "accepted" || item.status === "active")) throw new BookingAvailabilityConflictError();
    }

    const updated = await updateBookingStatus(tx, booking.id, next, actorId, reason);
    await createStatusHistory(tx, { bookingId: booking.id, fromStatus: booking.status, toStatus: next, changedById: actorId, reason });
    return { bookingId: updated.id, status: updated.status, conversationId: updated.conversationId, rejectionReason: updated.rejectionReason, transitionedAt: updated.updatedAt.toISOString(), transitionedBy: actorId };
  });
}

export function acceptBooking(db: PrismaClient, actorId: string, input: BookingAcceptInput) {
  return transitionBooking(db, actorId, input.bookingId, "accepted");
}

export function rejectBooking(db: PrismaClient, actorId: string, input: BookingRejectInput) {
  return transitionBooking(db, actorId, input.bookingId, "rejected", input.reason);
}

function decodeCursor(cursor?: string): { createdAt: Date; id: string } | undefined {
  if (!cursor) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as { createdAt?: string; id?: string };
    if (!parsed.createdAt || !parsed.id) throw new Error("invalid");
    return { createdAt: new Date(parsed.createdAt), id: parsed.id };
  } catch {
    throw new ValidationError("El cursor no es válido");
  }
}

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id }), "utf8").toString("base64url");
}

export async function listBookingRecords(db: PrismaClient, actorId: string, input: BookingListInput) {
  const rows = await listBookings(db, actorId, { ...input, status: input.status, fromDate: input.fromDate ? parseCalendarDate(input.fromDate) : undefined, toDate: input.toDate ? parseCalendarDate(input.toDate) : undefined, cursor: decodeCursor(input.cursor) });
  const hasMore = rows.length > input.limit;
  const items = (hasMore ? rows.slice(0, input.limit) : rows).map((row) => mapBooking(row as Awaited<ReturnType<typeof createBooking>>));
  const last = items.at(-1);
  return { items, nextCursor: hasMore && last ? encodeCursor(new Date(last.createdAt), last.id) : null };
}

export async function getBookingById(db: PrismaClient, actorId: string, bookingId: string) {
  const booking = await findBookingForActor(db, bookingId, actorId);
  if (!booking) throw new NotFoundError("Reserva no encontrada");
  return mapBooking(booking as Awaited<ReturnType<typeof createBooking>>);
}
