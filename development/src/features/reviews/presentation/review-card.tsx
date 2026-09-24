import { ReviewReportDialog } from "./review-report-dialog";
import { ReviewModerationStatus } from "./review-moderation-status";

export function ReviewCard({ review, allowReport = true }: { review: { id: string; rating: number; comment: string | null; authorName?: string | null; status?: "published" | "under_review" | "removed" }; allowReport?: boolean }) {
  if (review.status === "removed") return null;
  return <article className="review-card">
    <div aria-label={`Valoración ${review.rating} de 5`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
    {review.authorName && <strong>{review.authorName}</strong>}
    {review.comment && <p>{review.comment}</p>}
    <ReviewModerationStatus status={review.status ?? "published"} />
    {allowReport && <ReviewReportDialog reviewId={review.id} />}
  </article>;
}