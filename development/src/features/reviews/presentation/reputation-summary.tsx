import { ReviewCard } from "./review-card";

export type ReputationAggregate = { averageRating: number | null; reviewCount: number; categories: Array<{ category: string; averageRating: number; reviewCount: number }> };

export function ReputationSummary({ reputation, reviews = [], heading = "Reputación" }: { reputation: ReputationAggregate; reviews?: Array<{ id: string; rating: number; comment: string | null; authorName?: string | null; status?: "published" | "under_review" }>; heading?: string }) {
  return <section className="reviews-section" aria-label="Reputación pública">
    <h2>{heading}</h2>
    <div className="reviews-summary"><span className="reviews-average" aria-label={`Valoración media ${reputation.averageRating?.toFixed(1) ?? "sin valoraciones"} de 5`}>★ {reputation.averageRating?.toFixed(1) ?? "—"}</span><span className="reviews-count">{reputation.reviewCount} reseña{reputation.reviewCount !== 1 ? "s" : ""}</span></div>
    {reputation.categories.length > 0 && <div className="review-category-breakdown">{reputation.categories.map((category) => <div key={category.category}><span>{category.category}</span><strong>★ {category.averageRating.toFixed(1)}</strong></div>)}</div>}
    {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
  </section>;
}