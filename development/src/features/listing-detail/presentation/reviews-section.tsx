import type { ListingDetailDTO } from "@/types/listing-detail";
import { EmptySection } from "./empty-section";
import { ReputationSummary, type ReputationAggregate } from "@/features/reviews/presentation/reputation-summary";

/**
 * ReviewsSection — sección de reviews con puntuación media y distribución.
 * Muestra estado vacío "Aún no hay reviews" si no hay reviews.
 * Las reviews reales se obtienen del detalle precargado o del módulo §6 (futuro).
 * Ver spec.md FR-011.
 */
interface ReviewsSectionProps {
  listing: ListingDetailDTO;
  reputation?: ReputationAggregate;
}

export function ReviewsSection({ listing, reputation }: ReviewsSectionProps) {
  const visibleReviews = listing.reviews;
  const publicReputation = reputation ?? { averageRating: listing.ratingAverage || null, reviewCount: visibleReviews.length, categories: [] };
  if (visibleReviews.length === 0 && publicReputation.reviewCount === 0) {
    return (
      <EmptySection
        title="Reviews"
        message="Este producto aún no tiene valoraciones. ¡Sé el primero en alquilarlo!"
      />
    );
  }

  return (
    <section id="reviews" className="reviews-section" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading">Reviews</h2>
      <ReputationSummary reputation={publicReputation} reviews={visibleReviews.map((review) => ({ id: review.id, rating: review.rating, status: review.status, comment: review.comment, authorName: review.author.displayName }))} heading="Reviews" />
    </section>
  );
}
