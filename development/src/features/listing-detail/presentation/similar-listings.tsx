"use client";

import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/trpc-react";
import type { ListingDetailDTO } from "@/types/listing-detail";

/**
 * SimilarListings — productos similares de misma categoría y/o zona.
 * Usa React Query vía tRPC para obtener los similares. Ver spec.md FR-012.
 */
interface SimilarListingsProps {
  listing: ListingDetailDTO;
}

export function SimilarListings({ listing }: SimilarListingsProps) {
  const { data, isLoading } = api.listing.getSimilar.useQuery(
    {
      listingId: listing.id,
      categoryId: listing.category.id,
      city: listing.city ?? null,
      lat: listing.location?.lat ?? null,
      lng: listing.location?.lng ?? null,
      limit: 6,
    },
    { staleTime: 60_000 },
  );

  if (!isLoading && (!data || data.length === 0)) {
    return null; // Se omite si no hay similares
  }

  return (
    <section className="similar-listings" aria-labelledby="similar-heading">
      <h2 id="similar-heading">Productos similares</h2>
      {isLoading ? (
        <div className="similar-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="similar-card-skeleton">
              <div className="skeleton-image" />
              <div className="skeleton-line skeleton-title" />
              <div className="skeleton-line skeleton-text" />
            </div>
          ))}
        </div>
      ) : (
        <div className="similar-grid">
          {data?.map((similar) => (
            <Link
              key={similar.id}
              href={`/listings/${similar.slug}`}
              className="similar-card"
              aria-label={`Ver detalle de ${similar.title}`}
            >
              <div className="similar-card-image">
                {similar.primaryPhotoUrl ? (
                  <Image
                    src={similar.primaryPhotoUrl}
                    alt={similar.title}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 50vw, 25vw"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="similar-card-no-image" aria-hidden="true">
                    Sin imagen
                  </div>
                )}
              </div>
              <div className="similar-card-body">
                <h3 className="similar-card-title">{similar.title}</h3>
                {similar.city && (
                  <p className="similar-card-location">📍 {similar.city}</p>
                )}
                <div className="similar-card-meta">
                  <span className="similar-card-price">
                    {similar.pricePerDay} €<small>/día</small>
                  </span>
                  {similar.reviewCount > 0 && (
                    <span className="similar-card-rating">
                      ★ {similar.ratingAverage.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
