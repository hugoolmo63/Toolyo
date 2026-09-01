import Link from "next/link";
import Image from "next/image";
import type { SearchResultDTO } from "@/types/search";

/**
 * ResultCard — tarjeta de listing en vista grid.
 * Solo muestra campos públicos (sin email, teléfono, dirección exacta).
 * Ver spec.md FR-008 y contracts/search.md (SearchResultDTO).
 */
export function ResultCard({ listing }: { listing: SearchResultDTO }) {
  const href = `/listings/${listing.slug}`;

  return (
    <article className="result-card">
      <Link href={href} className="result-card-link" aria-label={`Ver detalle de ${listing.title}`}>
        <div className="result-card-image">
          {listing.primaryPhotoUrl ? (
            <Image
              src={listing.primaryPhotoUrl}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="result-card-no-image" aria-hidden="true">
              Sin imagen
            </div>
          )}
          {listing.owner.isVerified && (
            <span className="verified-badge" title="Arrendador verificado">
              ✓ Verificado
            </span>
          )}
        </div>
        <div className="result-card-body">
          <h3 className="result-card-title">{listing.title}</h3>
          <p className="result-card-location">
            {listing.city}
            {listing.distanceKm !== null && ` · ${listing.distanceKm} km`}
          </p>
          <div className="result-card-meta">
            <span className="result-card-price">
              {listing.pricePerDay} €<small>/día</small>
            </span>
            <span className="result-card-rating" aria-label={`Valoración ${listing.ratingAverage} de 5`}>
              ★ {listing.ratingAverage.toFixed(1)}
              {listing.reviewCount > 0 && (
                <small className="result-card-reviews"> ({listing.reviewCount})</small>
              )}
            </span>
          </div>
          <p className="result-card-owner">
            Por {listing.owner.displayName}
          </p>
        </div>
      </Link>
    </article>
  );
}
