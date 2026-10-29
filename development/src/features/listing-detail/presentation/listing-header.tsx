import Link from "next/link";
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
          {listing.category.parentName && listing.category.parentId && (
            <>
              <Link href={`/?cat=${encodeURIComponent(listing.category.parentId)}`}>
                {listing.category.parentName}
              </Link>
              <span aria-hidden="true"> &gt; </span>
            </>
          )}
          <Link href={`/?cat=${encodeURIComponent(listing.category.id)}`}>
            {listing.category.name}
          </Link>
        </span>
        {listing.isInstantBooking && (
          <span className="listing-instant-badge" title="Reserva instantánea">
            ⚡ Reserva instantánea
          </span>
        )}
      </div>

      <h1 className="listing-title">{listing.title}</h1>

      <div className="listing-meta">
        {listing.city && (
          <Link
            className="listing-location"
            href={listing.location
              ? `/?${new URLSearchParams({ loc: listing.city, lat: String(listing.location.lat), lng: String(listing.location.lng) }).toString()}`
              : `/?q=${encodeURIComponent(listing.city)}`}
            aria-label={`Buscar productos en ${listing.city}`}
          >
            📍 {listing.city}
            {listing.addressText && ` · ${listing.addressText}`}
          </Link>
        )}
        <a href="#reviews" className="listing-rating listing-rating-link" aria-label={`Ver ${listing.reviewCount} reseñas`}>
          ★ {listing.ratingAverage.toFixed(1)}
          <small className="listing-reviews"> ({listing.reviewCount})</small>
        </a>
      </div>
    </header>
  );
}
