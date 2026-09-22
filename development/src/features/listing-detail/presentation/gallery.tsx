"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import type { ListingPhotoDTO } from "@/types/listing-detail";

/**
 * Gallery — carrusel navegable con zoom y pantalla completa.
 * Accesible por teclado (flechas, Escape), foco visible, alt en imágenes.
 * Ver spec.md FR-002 y contracts/listing-detail.md.
 */
interface GalleryProps {
  photos: ListingPhotoDTO[];
  title: string;
}

export function Gallery({ photos, title }: GalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasPhotos = photos.length > 0;
  const currentPhoto = hasPhotos ? photos[currentIndex] : null;

  const goNext = useCallback(() => {
    if (!hasPhotos) return;
    setCurrentIndex((i) => (i + 1) % photos.length);
  }, [hasPhotos, photos.length]);

  const goPrev = useCallback(() => {
    if (!hasPhotos) return;
    setCurrentIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [hasPhotos, photos.length]);

  const closeZoom = useCallback(() => {
    setShowZoom(false);
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
    setIsFullscreen(false);
  }, []);

  // Navegación por teclado
  useEffect(() => {
    if (!showZoom) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeZoom();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showZoom, closeZoom, goNext, goPrev]);

  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fallback: abrir overlay de zoom si Fullscreen API no está disponible
      setShowZoom(true);
    }
  }, []);

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
    <div
      className={`gallery ${isFullscreen ? "gallery-fullscreen" : ""}`}
      ref={containerRef}
    >
      <div className="gallery-main">
        <button
          type="button"
          className="gallery-nav-btn gallery-prev"
          onClick={goPrev}
          aria-label="Imagen anterior"
          disabled={photos.length <= 1}
        >
          ‹
        </button>

        <button
          type="button"
          className="gallery-image-button"
          onClick={() => setShowZoom(true)}
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

        <button
          type="button"
          className="gallery-nav-btn gallery-next"
          onClick={goNext}
          aria-label="Imagen siguiente"
          disabled={photos.length <= 1}
        >
          ›
        </button>

        <span className="gallery-counter" aria-live="polite">
          {currentIndex + 1} / {photos.length}
        </span>

        <button
          type="button"
          className="gallery-fullscreen-btn"
          onClick={handleFullscreen}
          aria-label="Pantalla completa"
        >
          ⛶
        </button>
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

      {showZoom && currentPhoto && (
        <div
          className="gallery-zoom-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Imagen ampliada"
          onClick={closeZoom}
        >
          <button
            type="button"
            className="gallery-zoom-close"
            onClick={closeZoom}
            aria-label="Cerrar"
          >
            ✕
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
          <button
            type="button"
            className="gallery-nav-btn gallery-prev"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Imagen anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className="gallery-nav-btn gallery-next"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Imagen siguiente"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
