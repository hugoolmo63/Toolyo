import { AppError, ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/server/lib/errors/domain-errors";

export { ConflictError, ForbiddenError, NotFoundError, ValidationError };

export class InvalidBookingStateError extends AppError {
  constructor(message = "La reserva no permite esta transición") {
    super(message, "invalid_booking_state", 409);
  }
}

export class BookingAvailabilityConflictError extends AppError {
  constructor(message = "El intervalo solicitado no está disponible") {
    super(message, "booking_conflict", 409);
  }
}
