import { ForbiddenError } from "@/server/lib/errors/domain-errors";

export function assertBookingParticipant(actorId: string, renterId: string, ownerId: string) {
  if (actorId !== renterId && actorId !== ownerId) throw new ForbiddenError("No participas en esta reserva");
}

export function assertModerator(role: "user" | "admin" | "ADMIN" | "MODERATOR") {
  if (role !== "admin" && role !== "ADMIN" && role !== "MODERATOR") throw new ForbiddenError("Se requiere rol de moderación");
}
