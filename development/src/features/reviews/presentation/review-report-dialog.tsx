"use client";

import { useState } from "react";
import { api } from "@/lib/trpc-react";

const reasons = [
  ["offensive", "Contenido ofensivo"],
  ["inappropriate", "Contenido inapropiado"],
  ["false", "Información falsa"],
  ["irrelevant", "No relacionado con la operación"],
] as const;

export function ReviewReportDialog({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof reasons)[number][0]>("offensive");
  const [description, setDescription] = useState("");
  const mutation = api.reviews.reportReview.useMutation({ onSuccess: () => setOpen(false) });

  return <>
    <button type="button" className="review-report-trigger" onClick={() => setOpen(true)}>Reportar</button>
    {open && <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby={`report-title-${reviewId}`}>
      <section className="dialog">
        <div className="dialog-body">
          <h2 id={`report-title-${reviewId}`}>Reportar reseña</h2>
          <p>El reporte será revisado por el equipo de moderación. La reseña seguirá visible mientras se revisa.</p>
          <label className="field">Motivo
            <select className="input" value={reason} onChange={(event) => setReason(event.target.value as typeof reason)}>
              {reasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="field">Detalles (opcional)
            <textarea className="input" rows={4} maxLength={5000} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          {mutation.error && <p className="form-error" role="alert">{mutation.error.message}</p>}
        </div>
        <div className="dialog-footer">
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
          <button type="button" className="btn btn-danger" disabled={mutation.isPending} onClick={() => mutation.mutate({ reviewId, reason, description: description.trim() || undefined })}>
            {mutation.isPending ? "Enviando…" : "Enviar reporte"}
          </button>
        </div>
      </section>
    </div>}
  </>;
}