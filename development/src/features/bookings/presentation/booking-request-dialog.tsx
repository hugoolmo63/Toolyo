"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc-react";
import { BookingSummary } from "./booking-summary";

/**
 * BookingRequestDialog — confirma la solicitud de reserva (008-modulo-reservas, §4.3).
 * Modal en desktop; envía `booking.request` (sin importes: el servidor calcula el
 * desglose) y navega al chat contextual `/messages/[conversationId]?booking=`.
 * La clave de idempotencia se genera al abrir el diálogo y se reutiliza en reintentos.
 */
interface BookingRequestDialogProps {
  listing: { id: string; title: string; pricePerDay: number };
  /** ISO date YYYY-MM-DD */
  startDate: string;
  /** ISO date YYYY-MM-DD */
  endDate: string;
  onClose: () => void;
}

function newIdempotencyKey(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

function formatDay(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function BookingRequestDialog({ listing, startDate, endDate, onClose }: BookingRequestDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLElement>(null);
  const idempotencyKey = useRef(newIdempotencyKey());

  const request = api.booking.request.useMutation({
    onSuccess: (booking) => {
      router.replace(`/messages/${booking.conversationId}?booking=${booking.id}`);
    },
  });

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !request.isPending) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  return (
    <div className="dialog-backdrop" role="presentation" onClick={(event) => {
      if (event.target === event.currentTarget && !request.isPending) onClose();
    }}>
      <section
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-request-title"
      >
        <div className="dialog-body">
          <h2 id="booking-request-title">Solicitar reserva</h2>
          <p className="booking-dialog-listing">{listing.title}</p>
          <dl className="booking-dialog-dates">
            <div>
              <dt>Inicio</dt>
              <dd>{formatDay(startDate)}</dd>
            </div>
            <div>
              <dt>Fin</dt>
              <dd>{formatDay(endDate)}</dd>
            </div>
          </dl>
          <BookingSummary pricePerDay={listing.pricePerDay} startDate={startDate} endDate={endDate} />
          <p className="form-footnote">
            Se abrirá un chat con el arrendador después de enviar la solicitud.
          </p>
          {request.error && (
            <p className="form-error" role="alert">{request.error.message}</p>
          )}
        </div>
        <div className="dialog-footer">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={request.isPending}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            data-autofocus
            data-testid="booking-request-submit"
            disabled={request.isPending}
            onClick={() =>
              request.mutate({
                listingId: listing.id,
                startDate,
                endDate,
                idempotencyKey: idempotencyKey.current,
              })
            }
          >
            {request.isPending ? "Enviando…" : "Enviar solicitud"}
          </button>
        </div>
      </section>
    </div>
  );
}
