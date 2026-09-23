import { describe, expect, it } from "vitest";
import { InvalidBookingStateError } from "@/features/bookings/domain/booking-errors";

describe("booking domain errors", () => {
  it("exposes an invalid transition as a conflict-safe domain error", () => {
    const error = new InvalidBookingStateError();
    expect(error.code).toBe("invalid_booking_state");
    expect(error.statusCode).toBe(409);
  });
});
