"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SearchResultDTO } from "@/types/search";

/**
 * ResultCard — tarjeta de listing en vista grid.
 * Solo muestra campos públicos (sin email, teléfono, dirección exacta).
 * Ver spec.md FR-008 y contracts/search.md (SearchResultDTO).
 */
export function ResultCard({ listing, openInNewTab = false }: { listing: SearchResultDTO; openInNewTab?: boolean }) {
  const href = `/listings/${listing.slug}`;
  const photos = listing.photoUrls?.length
    ? listing.photoUrls
    : listing.primaryPhotoUrl
      ? [listing.primaryPhotoUrl]
      : [];
  const [photoIndex, setPhotoIndex] = useState(0);
  const activePhoto = photos[photoIndex] ?? listing.primaryPhotoUrl;

  function changePhoto(event: MouseEvent<HTMLButtonElement>, direction: -1 | 1) {
    event.preventDefault();
    event.stopPropagation();
    setPhotoIndex((current) => Math.max(0, Math.min(photos.length - 1, current + direction)));
  }

  return (
    <article className="result-card">
      <div className="result-card-image">
        <Link
          href={href}
          className="result-card-photo-link"
          aria-label={`Ver fotos de ${listing.title}`}
          {...(openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {activePhoto ? (
            <Image
              key={activePhoto}
              src={activePhoto}
              alt={listing.title}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="result-card-no-image" aria-hidden="true">
              Sin imagen
            </div>
          )}
        </Link>
        {photos.length > 1 && (
          <>
            {photoIndex > 0 && (
            <button
              type="button"
              className="result-card-photo-nav previous"
              aria-label={`Foto anterior de ${listing.title}`}
              onClick={(event) => changePhoto(event, -1)}
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            )}
            {photoIndex < photos.length - 1 && (
            <button
              type="button"
              className="result-card-photo-nav next"
              aria-label={`Foto siguiente de ${listing.title}`}
              onClick={(event) => changePhoto(event, 1)}
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
            )}
          </>
        )}
      </div>
      <Link
        href={href}
        className="result-card-link"
        aria-label={`Ver detalle de ${listing.title}`}
        {...(openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
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
        </div>
      </Link>
    </article>
  );
}
