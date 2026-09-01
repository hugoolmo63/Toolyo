import type { ListingDetailDTO } from "@/types/listing-detail";
import { EmptySection } from "./empty-section";

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
  if (listing.reviewCount === 0) {
    return (
      <EmptySection
        title="Reviews"
        message="Aún no hay reviews para este producto."
        suggestion="Sé el primero en alquilar y dejar tu valoración."
      />
    );
  }

  return (
    <section className="reviews-section" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading">Reviews</h2>
      <div className="reviews-summary">
        <span
          className="reviews-average"
          aria-label={`Valoración media ${listing.ratingAverage.toFixed(1)} de 5`}
        >
          ★ {listing.ratingAverage.toFixed(1)}
        </span>
        <span className="reviews-count">
          {listing.reviewCount} review{listing.reviewCount !== 1 ? "s" : ""}
        </span>
      </div>
      {/* Las reviews individuales se renderizarán cuando el módulo §6 exista */}
      <p className="reviews-placeholder">
        Las reviews detalladas estarán disponibles próximamente.
      </p>
    </section>
  );
}
