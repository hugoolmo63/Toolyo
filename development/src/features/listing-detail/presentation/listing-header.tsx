import type { ListingDetailDTO } from "@/types/listing-detail";

/**
 * ListingHeader — título, categoría, ubicación, badges y rating.
 * Solo campos públicos. Ver spec.md FR-003.
 */
interface ListingHeaderProps {
  listing: ListingDetailDTO;
}

export function ListingHeader({ listing }: ListingHeaderProps) {
  return (
    <header className="listing-header">
      <div className="listing-header-badges">
        <span className="listing-category-badge">
          {listing.category.parentName
            ? `${listing.category.parentName} > ${listing.category.name}`
            : listing.category.name}
        </span>
        {listing.isInstantBooking && (
          <span className="listing-instant-badge" title="Reserva instantánea">
            ⚡ Reserva instantánea
          </span>
        )}
        {listing.owner.isVerified && (
          <span className="listing-verified-badge" title="Arrendador verificado">
            ✓ Verificado
          </span>
        )}
      </div>

      <h1 className="listing-title">{listing.title}</h1>

      <div className="listing-meta">
        {listing.city && (
          <span className="listing-location">
            📍 {listing.city}
            {listing.addressText && ` · ${listing.addressText}`}
          </span>
        )}
        <a href="#reviews" className="listing-rating listing-rating-link" aria-label={`Ver ${listing.reviewCount} reseñas`}>
          ★ {listing.ratingAverage.toFixed(1)}
          <small className="listing-reviews"> ({listing.reviewCount})</small>
        </a>
      </div>
    </header>
  );
}
