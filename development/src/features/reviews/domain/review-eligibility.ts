import { ConflictError, ValidationError } from "@/server/lib/errors/domain-errors";

const REVIEW_WINDOW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export function assertCompletedAtImmutable(previous: Date | null, next: Date | null) {
  if (previous && (!next || previous.getTime() !== next.getTime())) {
    throw new ConflictError("Booking.completedAt es inmutable después de completar la reserva");
  }
}

export function assertReviewEligible(status: string, completedAt: Date | null, now = new Date()) {
  if (status !== "completed" || !completedAt) {
    throw new ValidationError("La reserva no es elegible para reviews");
  }
  const deadline = completedAt.getTime() + REVIEW_WINDOW_DAYS * DAY_MS;
  if (now.getTime() >= deadline) {
    throw new ValidationError("La ventana de review de 14 días ha expirado");
  }
  return new Date(deadline);
}

export function reviewWindowExpired(completedAt: Date, now = new Date()) {
  return now.getTime() >= completedAt.getTime() + REVIEW_WINDOW_DAYS * DAY_MS;
}
