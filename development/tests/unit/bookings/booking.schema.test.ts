import { describe, expect, it } from "vitest";
import { BookingGetByIdSchema, BookingListSchema, BookingRejectSchema, BookingRequestSchema } from "@/features/bookings/shared/booking.schema";

describe("booking schemas", () => {
  it("accepts request and defaults list values", () => {
    expect(BookingRequestSchema.safeParse({ listingId: "listing-1", startDate: "2030-06-01", endDate: "2030-06-03", idempotencyKey: "request-1234" }).success).toBe(true);
    expect(BookingListSchema.parse({})).toMatchObject({ role: "all", limit: 20 });
  });

  it("validates rejection reason, detail id and date filter order", () => {
    expect(BookingRejectSchema.safeParse({ bookingId: "booking-1", reason: "No disponible" }).success).toBe(true);
    expect(BookingGetByIdSchema.safeParse({ bookingId: "booking-1" }).success).toBe(true);
    expect(BookingListSchema.safeParse({ fromDate: "2030-06-04", toDate: "2030-06-01" }).success).toBe(false);
  });
});
