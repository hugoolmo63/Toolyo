import Link from "next/link";
import Image from "next/image";
import type { SearchResultDTO } from "@/types/search";

/**
 * ResultRow — fila de listing en vista lista (más compacta que la tarjeta grid).
 * Solo muestra campos públicos. Ver spec.md FR-014, FR-015.
 */
export function ResultRow({ listing }: { listing: SearchResultDTO }) {
  const href = `/listings/${listing.slug}`;

  return (
    <article className="result-row">
      <Link href={href} className="result-row-link" aria-label={`Ver detalle de ${listing.title}`}>
        <div className="result-row-image">
          {listing.primaryPhotoUrl ? (
            <Image
              src={listing.primaryPhotoUrl}
              alt={listing.title}
              fill
              sizes="120px"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="result-card-no-image" aria-hidden="true">
              Sin imagen
            </div>
          )}
        </div>
        <div className="result-row-body">
          <div className="result-row-main">
            <h3 className="result-row-title">{listing.title}</h3>
            <p className="result-row-location">
              {listing.city}
              {listing.distanceKm !== null && ` · ${listing.distanceKm} km`}
            </p>
            <p className="result-row-owner">
              Por {listing.owner.displayName}
              {listing.owner.isVerified && " ✓"}
            </p>
          </div>
          <div className="result-row-meta">
            <span className="result-row-price">
              {listing.pricePerDay} €<small>/día</small>
            </span>
            <span className="result-row-rating" aria-label={`Valoración ${listing.ratingAverage} de 5`}>
              ★ {listing.ratingAverage.toFixed(1)}
              {listing.reviewCount > 0 && (
                <small className="result-card-reviews"> ({listing.reviewCount})</small>
              )}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
