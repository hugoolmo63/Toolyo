export function ReviewModerationStatus({ status }: { status: "published" | "under_review" | "removed" }) {
  if (status === "published") return null;
  return <p className={`review-moderation-status review-moderation-status-${status}`} role="status">
    {status === "under_review" ? "Esta reseña está siendo revisada; sigue visible mientras se resuelve el reporte." : "Esta reseña ha sido retirada por moderación."}
  </p>;
}