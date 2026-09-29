"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc-react";
import { RejectBookingDialog } from "./reject-booking-dialog";

/**
 * OwnerBookingActions — decisiones del arrendador sobre una solicitud
 * `pending` (008-modulo-reservas, §5.2/§5.5/§10). Aceptar es directo;
 * Rechazar abre RejectBookingDialog con motivo opcional. Tras la mutación se
 * invalidan las queries de reservas/mensajería y se refresca el RSC para que
 * panel y chat reflejen el nuevo estado.
 */
export function OwnerBookingActions({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const utils = api.useUtils();
  const [rejectOpen, setRejectOpen] = useState(false);

  const refresh = () => {
    void utils.booking.list.invalidate();
    void utils.booking.getById.invalidate();
    void utils.messaging.getConversation.invalidate();
    void utils.messaging.listConversations.invalidate();
    void utils.messaging.listMessages.invalidate();
    router.refresh();
  };

  const accept = api.booking.accept.useMutation({ onSuccess: refresh });

  return (
    <div className="booking-actions">
      <button
        type="button"
        className="btn btn-primary btn-sm"
        data-testid="booking-accept"
        disabled={accept.isPending}
        onClick={() => accept.mutate({ bookingId })}
      >
        {accept.isPending ? "Aceptando…" : "Aceptar reserva"}
      </button>
      <button
        type="button"
        className="btn btn-ghost-danger btn-sm"
        data-testid="booking-reject"
        disabled={accept.isPending}
        onClick={() => setRejectOpen(true)}
      >
        Rechazar
      </button>
      {accept.error && (
        <p className="form-error" role="alert">{accept.error.message}</p>
      )}
      {rejectOpen && (
        <RejectBookingDialog
          bookingId={bookingId}
          onClose={() => setRejectOpen(false)}
          onRejected={refresh}
        />
      )}
    </div>
  );
}
