export function ReviewStatusMessage({ status, publicationReason }: { status: "hidden" | "published" | "under_review" | "removed"; publicationReason?: "awaiting_other_review" | "both_reviews_submitted" }) {
  if (status === "published") return <p className="review-status-message" role="status">{publicationReason === "both_reviews_submitted" ? "Ambas valoraciones se han publicado." : "Tu valoración está publicada."}</p>;
  if (status === "under_review") return <p className="review-status-message" role="status">La valoración está siendo revisada y permanece visible mientras se resuelve el reporte.</p>;
  if (status === "removed") return <p className="review-status-message" role="status">La valoración ha sido retirada por moderación.</p>;
  return <p className="review-status-message" role="status">La valoración está oculta hasta que la otra parte responda o venza el plazo de 14 días.</p>;
}