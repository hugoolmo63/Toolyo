import { formatEur } from "./booking-summary";
import { BookingStatusBadge } from "./booking-status-badge";
import { OwnerBookingActions } from "./owner-booking-actions";

/**
 * BookingActionCard — tarjeta de decisión del arrendador dentro del chat
 * (008-modulo-reservas, §5.5). En `pending` muestra Aceptar/Rechazar; en el
 * resto de estados muestra el resultado (con motivo si la solicitud fue
 * rechazada). Solo se renderiza cuando el visitante es el owner.
 */
export interface BookingActionCardData {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalPrice: string;
  rejectionReason?: string | null;
}

interface BookingActionCardProps {
  booking: BookingActionCardData;
  listingTitle?: string;
}

const headlines: Record<string, string> = {
  pending: "Solicitud de reserva",
  accepted: "Reserva aceptada",
  rejected: "Solicitud rechazada",
  cancelled: "Reserva cancelada",
  active: "Reserva activa",
  completed: "Reserva completada",
};

const stateNotes: Record<string, string> = {
  accepted: "Continúa la coordinación por chat.",
  active: "El alquiler está en curso.",
  completed: "El alquiler ha finalizado.",
  cancelled: "La reserva fue cancelada.",
};

function formatDay(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

export function BookingActionCard({ booking, listingTitle }: BookingActionCardProps) {
  return (
    <section className="booking-action-card" aria-label="Gestión de la reserva">
      <div className="booking-action-card-head">
        <p className="booking-action-card-title">{headlines[booking.status] ?? "Reserva"}</p>
        <BookingStatusBadge status={booking.status} />
      </div>
      {listingTitle && <p className="booking-action-card-detail">{listingTitle}</p>}
      <p className="booking-action-card-detail">
        {formatDay(booking.startDate)} – {formatDay(booking.endDate)} · Total{" "}
        {formatEur(booking.totalPrice)}
      </p>
      {booking.status === "pending" && <OwnerBookingActions bookingId={booking.id} />}
      {booking.status === "rejected" && booking.rejectionReason && (
        <p className="booking-action-card-detail">Motivo: {booking.rejectionReason}</p>
      )}
      {stateNotes[booking.status] && (
        <p className="booking-action-card-detail">{stateNotes[booking.status]}</p>
      )}
    </section>
  );
}
