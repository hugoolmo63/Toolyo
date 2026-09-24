"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks/use-session";
import { useAuthDialog } from "@/providers/auth-dialog-provider";
import type { ListingDetailDTO } from "@/types/listing-detail";

/**
 * ActionButtons — botones "Contactar" y "Reservar" con gating de login.
 * Entry-points que enrutan a /messages y /checkout (futuros módulos §5 y §4)
 * o muestran "próximamente" si no existen. Ver spec.md FR-008, FR-009.
 *
 * Gating de login no bloqueante (007-login-contextual, FR-004/FR-005):
 * - Sin sesión → abre el diálogo de login en contexto (sin redirección;
 *   el usuario conserva listing y fechas seleccionadas)
 * - Con sesión → redirige a /messages o /checkout
 */
interface ActionButtonsProps {
  listing: ListingDetailDTO;
}

export function ActionButtons({ listing }: ActionButtonsProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
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

    router.push(
      `/checkout?listing=${encodeURIComponent(listing.slug)}&start=${start}&end=${end}`,
    );
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
      >
        Reservar
      </button>
    </div>
  );
}
