import { BookingStatusBadge } from "@/features/bookings/presentation/booking-status-badge";
import { formatEur } from "@/features/bookings/presentation/booking-summary";

/**
 * BookingContextBanner — contexto de la reserva sobre el hilo de mensajes
 * (008-modulo-reservas, §4.4/§6.2). Muestra estado, fechas y total.
 */

const statusHeadline: Record<string, string> = {
  pending: "Solicitud enviada · Pendiente de respuesta",
  accepted: "Reserva aceptada",
  rejected: "Solicitud rechazada",
  cancelled: "Reserva cancelada",
  active: "Reserva activa",
  completed: "Reserva completada",
};

export interface BookingContextData {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalPrice: string;
  currencyCode: string;
}

function formatDay(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

export function BookingContextBanner({ booking }: { booking: BookingContextData }) {
  return (
    <section className="booking-context-banner" aria-label="Contexto de la reserva">
      <div className="booking-context-banner-text">
        <p className="booking-context-banner-title">
          {statusHeadline[booking.status] ?? "Reserva"}
        </p>
        <p className="booking-context-banner-dates">
          {formatDay(booking.startDate)} – {formatDay(booking.endDate)} · Total{" "}
          {formatEur(booking.totalPrice)}
        </p>
      </div>
      <BookingStatusBadge status={booking.status} />
    </section>
  );
}
