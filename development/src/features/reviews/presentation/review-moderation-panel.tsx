"use client";

import { useState } from "react";
import { api } from "@/lib/trpc-react";

type PendingReport = { id: string; reviewId: string; reason: string; description: string | null; createdAt: string | Date; review: { status: string; overallRating: number; comment: string | null; listingId: string; authorId: string }; reporter: { id: string; displayName: string | null } };

export function ReviewModerationPanel({ initialReports }: { initialReports: PendingReport[] }) {
  const [reports, setReports] = useState(initialReports);
  const [resolution, setResolution] = useState<Record<string, string>>({});
  const mutation = api.reviews.resolveReport.useMutation({
    onSuccess: (_, input) => setReports((current) => current.filter((report) => report.id !== input.reportId)),
  });

  return <main className="moderation-page">
    <div className="page-header"><div><h1 className="page-title">Moderación de reseñas</h1><p className="page-subtitle">Revisa reportes pendientes y conserva la trazabilidad de cada decisión.</p></div></div>
    {reports.length === 0 ? <p className="dashboard-section">No hay reportes pendientes.</p> : <div className="moderation-report-list">
      {reports.map((report) => <article className="moderation-report-card" key={report.id}>
        <div><span className="badge badge-warning">{report.reason}</span><p>{report.review.comment ?? "Sin comentario"}</p><small>Reportado por {report.reporter.displayName ?? "Usuario"}</small></div>
        <label className="field">Resolución<textarea className="input" rows={3} value={resolution[report.id] ?? ""} onChange={(event) => setResolution((current) => ({ ...current, [report.id]: event.target.value }))} /></label>
        {mutation.error && mutation.variables?.reportId === report.id && <p className="form-error" role="alert">{mutation.error.message}</p>}
        <div className="form-actions">
          <button type="button" className="btn btn-primary" disabled={mutation.isPending || !(resolution[report.id] ?? "").trim()} onClick={() => mutation.mutate({ reportId: report.id, decision: "published", resolution: resolution[report.id]!.trim() })}>Mantener publicada</button>
          <button type="button" className="btn btn-danger" disabled={mutation.isPending || !(resolution[report.id] ?? "").trim()} onClick={() => mutation.mutate({ reportId: report.id, decision: "removed", resolution: resolution[report.id]!.trim() })}>Retirar reseña</button>
        </div>
      </article>)}
    </div>}
  </main>;
}