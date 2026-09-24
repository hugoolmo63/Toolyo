"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks/use-session";
import { useAuthDialog } from "@/providers/auth-dialog-provider";
import { BookingRequestDialog } from "@/features/bookings/presentation/booking-request-dialog";
import type { ListingDetailDTO } from "@/types/listing-detail";

/**
 * ActionButtons — botones "Contactar" y "Reservar" con gating de login.
 * "Contactar" enruta a /messages (módulo §5); "Reservar" abre el
 * BookingRequestDialog (008-modulo-reservas, §4.3) que envía booking.request
 * y navega al chat contextual. Ver spec.md FR-008, FR-009.
 *
 * Gating de login no bloqueante (007-login-contextual, FR-004/FR-005):
 * - Sin sesión → abre el diálogo de login en contexto (sin redirección;
 *   el usuario conserva listing y fechas seleccionadas)
 * - Con sesión → redirige a /messages o abre el diálogo de reserva
 */
interface ActionButtonsProps {
  listing: ListingDetailDTO;
}

export function ActionButtons({ listing }: ActionButtonsProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [bookingRange, setBookingRange] = useState<{ start: string; end: string } | null>(null);
  const { isAuthenticated, isLoading: sessionLoading } = useSession();
  const { open: openLoginDialog } = useAuthDialog();

  const handleContact = () => {
    setMessage(null);
    if (!isAuthenticated) {
      openLoginDialog();
      return;
    }
    router.push(`/messages?listing=${encodeURIComponent(listing.slug)}`);
  };

  const handleBook = () => {
    setMessage(null);
    // Verificar que hay rango seleccionado
    const url = new URL(window.location.href);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");

    if (!start || !end) {
      setMessage("Selecciona un rango de fechas para reservar.");
      return;
    }

    if (!isAuthenticated) {
      openLoginDialog();
      return;
    }

    setBookingRange({ start, end });
  };

  return (
    <div className="action-buttons">
      {message && (
        <p className="action-buttons-message" role="alert">
          {message}
        </p>
      )}
      <button
        type="button"
        className="action-btn action-btn-contact"
        onClick={handleContact}
        disabled={sessionLoading}
        aria-label="Contactar con el arrendador"
      >
        Contactar
      </button>
      <button
        type="button"
        className="action-btn action-btn-book"
        onClick={handleBook}
        disabled={sessionLoading}
        aria-label="Reservar este producto"
        data-testid="booking-request-open"
      >
        Reservar
      </button>
      {bookingRange && (
        <BookingRequestDialog
          listing={{ id: listing.id, title: listing.title, pricePerDay: listing.pricePerDay }}
          startDate={bookingRange.start}
          endDate={bookingRange.end}
          onClose={() => setBookingRange(null)}
        />
      )}
    </div>
  );
}
