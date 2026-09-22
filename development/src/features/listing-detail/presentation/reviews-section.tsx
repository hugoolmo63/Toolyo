import type { ListingDetailDTO } from "@/types/listing-detail";
import { EmptySection } from "./empty-section";
import { ListingReviewsList } from "./listing-reviews-list";

/**
 * ReviewsSection — sección de reviews con puntuación media y distribución.
 * Muestra estado vacío "Aún no hay reviews" si no hay reviews.
 * Las reviews reales se obtienen del detalle precargado o del módulo §6 (futuro).
 * Ver spec.md FR-011.
 */
interface ReviewsSectionProps {
  listing: ListingDetailDTO;
}

export function ReviewsSection({ listing }: ReviewsSectionProps) {
  if (listing.reviews.length === 0) {
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
      <div className="reviews-summary">
        <span
          className="reviews-average"
          aria-label={`Valoración media ${listing.ratingAverage.toFixed(1)} de 5`}
        >
          ★ {listing.ratingAverage.toFixed(1)}
        </span>
        <span className="reviews-count">
          {listing.reviews.length} reseña{listing.reviews.length !== 1 ? "s" : ""}
        </span>
      </div>
      <ListingReviewsList reviews={listing.reviews} />
    </section>
  );
}
