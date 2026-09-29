"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/trpc-react";

/**
 * RejectBookingDialog — confirma el rechazo de una solicitud (008-modulo-reservas, §5.5).
 * Motivo opcional de máximo 500 caracteres; envía `booking.reject`.
 */
interface RejectBookingDialogProps {
  bookingId: string;
  onClose: () => void;
  onRejected?: () => void;
}

export function RejectBookingDialog({ bookingId, onClose, onRejected }: RejectBookingDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const [reason, setReason] = useState("");

  const reject = api.booking.reject.useMutation({
    onSuccess: () => {
      onRejected?.();
      onClose();
    },
  });

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !reject.isPending) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  return (
    <div className="dialog-backdrop" role="presentation" onClick={(event) => {
      if (event.target === event.currentTarget && !reject.isPending) onClose();
    }}>
      <section
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-booking-title"
      >
        <div className="dialog-body">
          <h2 id="reject-booking-title">Rechazar solicitud</h2>
          <p>El arrendatario verá la reserva como rechazada.</p>
          <label className="field">
            Motivo (opcional)
            <textarea
              className="input"
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ej.: Fechas no disponibles"
              data-autofocus
            />
          </label>
          {reject.error && (
            <p className="form-error" role="alert">{reject.error.message}</p>
          )}
        </div>
        <div className="dialog-footer">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={reject.isPending}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            data-testid="booking-reject-submit"
            disabled={reject.isPending}
            onClick={() => reject.mutate({ bookingId, reason: reason.trim() || undefined })}
          >
            {reject.isPending ? "Rechazando…" : "Confirmar rechazo"}
          </button>
        </div>
      </section>
    </div>
  );
}
