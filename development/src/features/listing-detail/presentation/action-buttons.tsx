"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc-react";
import type { ListingDetailDTO } from "@/types/listing-detail";

/**
 * ActionButtons — botones "Contactar" y "Reservar" con gating de login.
 * Entry-points que enrutan a /messages y /checkout (futuros módulos §5 y §4)
 * o muestran "próximamente" si no existen. Ver spec.md FR-008, FR-009.
 *
 * Gating de login no bloqueante:
 * - Sin sesión → redirige a /auth?tab=login&callbackUrl=... (preserva contexto)
 * - Con sesión → redirige a /messages o /checkout
 */
interface ActionButtonsProps {
  listing: ListingDetailDTO;
}

export function ActionButtons({ listing }: ActionButtonsProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const { data: session, isLoading: sessionLoading } = api.auth.getSession.useQuery(
    undefined,
    { staleTime: 60_000, retry: false },
  );

  const isLoggedIn = session !== null && session !== undefined;

  const buildCallbackUrl = (includeRange: boolean): string => {
    const path = `/listings/${encodeURIComponent(listing.slug)}`;
    if (!includeRange) return path;
    const url = new URL(window.location.href);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    if (start && end) {
      return `${path}?start=${start}&end=${end}`;
    }
    return path;
  };

  const handleContact = () => {
    setMessage(null);
    if (!isLoggedIn) {
      const callback = encodeURIComponent(buildCallbackUrl(false));
      router.push(`/auth?tab=login&callbackUrl=${callback}`);
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

    if (!isLoggedIn) {
      const callback = encodeURIComponent(buildCallbackUrl(true));
      router.push(`/auth?tab=login&callbackUrl=${callback}`);
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
