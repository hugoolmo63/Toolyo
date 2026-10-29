"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { ListingPhotoDTO } from "@/types/listing-detail";

/**
 * Gallery — carrusel navegable con vista ampliada.
 * Accesible por teclado (flechas, Escape), foco visible, alt en imágenes.
 * Ver spec.md FR-002 y contracts/listing-detail.md.
 */
interface GalleryProps {
  photos: ListingPhotoDTO[];
  title: string;
}

function GalleryArrow({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={direction === "previous" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

function GalleryCloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m18 6-12 12M6 6l12 12" />
    </svg>
  );
}

export function Gallery({ photos, title }: GalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const hasPhotos = photos.length > 0;
  const currentPhoto = hasPhotos ? photos[currentIndex] : null;

  const goNext = useCallback(() => {
    if (!hasPhotos) return;
    setCurrentIndex((i) => Math.min(photos.length - 1, i + 1));
  }, [hasPhotos, photos.length]);

  const goPrev = useCallback(() => {
    if (!hasPhotos) return;
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, [hasPhotos, photos.length]);

  const closeZoom = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Navegación por teclado
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeZoom();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, closeZoom, goNext, goPrev]);

  if (!hasPhotos) {
    return (
      <div className="gallery gallery-empty" aria-label="Sin imágenes disponibles">
        <div className="gallery-placeholder" aria-hidden="true">
          Sin imágenes
        </div>
      </div>
    );
  }

  return (
    <div className="gallery">
      <div className="gallery-main">
        {photos.length > 1 && currentIndex > 0 && (
          <button
            type="button"
            className="gallery-nav-btn gallery-prev"
            onClick={goPrev}
            aria-label="Imagen anterior"
          >
            <GalleryArrow direction="previous" />
          </button>
        )}

        <button
          type="button"
          className="gallery-image-button"
          onClick={() => setIsOpen(true)}
          aria-label={`Ampliar imagen ${currentIndex + 1} de ${photos.length}`}
        >
          {currentPhoto && (
            <Image
              src={currentPhoto.url}
              alt={currentPhoto.altText ?? title}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
              style={{ objectFit: "cover" }}
              priority={currentIndex === 0}
            />
          )}
        </button>

        {photos.length > 1 && currentIndex < photos.length - 1 && (
          <button
            type="button"
            className="gallery-nav-btn gallery-next"
            onClick={goNext}
            aria-label="Imagen siguiente"
          >
            <GalleryArrow direction="next" />
          </button>
        )}

        {photos.length > 1 && (
          <span className="gallery-counter" aria-live="polite">
            {currentIndex + 1} / {photos.length}
          </span>
        )}

      </div>

      {photos.length > 1 && (
        <div className="gallery-thumbnails" role="tablist" aria-label="Miniaturas de la galería">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              role="tab"
              aria-selected={i === currentIndex}
              aria-label={`Ver imagen ${i + 1}`}
              className={`gallery-thumbnail ${i === currentIndex ? "active" : ""}`}
              onClick={() => setCurrentIndex(i)}
            >
              <Image
                src={photo.url}
                alt=""
                width={60}
                height={60}
                unoptimized
                style={{ objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      )}

      {isOpen && currentPhoto && (
        <div
          className="gallery-zoom-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Imagen ampliada"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeZoom();
          }}
        >
          <button
            type="button"
            className="gallery-zoom-close"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsOpen(false);
            }}
            aria-label="Cerrar vista ampliada"
          >
            <GalleryCloseIcon />
          </button>
          <div className="gallery-zoom-image" onClick={(e) => e.stopPropagation()}>
            <Image
              src={currentPhoto.url}
              alt={currentPhoto.altText ?? title}
              fill
              unoptimized
              sizes="100vw"
              style={{ objectFit: "contain" }}
            />
          </div>
          {photos.length > 1 && (
            <>
              {currentIndex > 0 && <button
                type="button"
                className="gallery-nav-btn gallery-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                aria-label="Imagen anterior"
              >
                <GalleryArrow direction="previous" />
              </button>}
              {currentIndex < photos.length - 1 && <button
                type="button"
                className="gallery-nav-btn gallery-next"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                aria-label="Imagen siguiente"
              >
                <GalleryArrow direction="next" />
              </button>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
