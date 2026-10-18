"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import type { ListingReviewDTO } from "../domain/listing-detail";

function ReviewStars({ rating }: { rating: number }) {
  return <span className="review-stars" aria-label={`Valoración ${rating} de 5`}>{Array.from({ length: 5 }, (_, index) => <svg key={index} viewBox="0 0 20 20" aria-hidden="true" className={index < rating ? "filled" : "empty"}><path d="M10 1.5l2.62 5.3 5.85.85-4.23 4.12 1 5.83L10 14.85l-5.24 2.75 1-5.83L1.53 7.65l5.85-.85L10 1.5z" /></svg>)}</span>;
}

export function ListingReviewsList({ reviews }: { reviews: ListingReviewDTO[] }) {
  const [visibleCount, setVisibleCount] = useState(5);
  const hasMore = visibleCount < reviews.length;
  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    enabled: hasMore,
    onLoadMore: () => setVisibleCount((count) => count + 5),
  });
  const visibleReviews = reviews.slice(0, visibleCount);
  return <>
    <div className="listing-reviews-list">
      {visibleReviews.map((review) => <article key={review.id} className="listing-review-card">
        <Link href={`/users/${review.author.id}`} className="listing-review-author">
          {review.author.avatarUrl ? <Image src={review.author.avatarUrl} alt="" width={32} height={32} unoptimized /> : <span aria-hidden="true">{review.author.displayName?.slice(0, 1) ?? "U"}</span>}
          <strong>{review.author.displayName ?? "Usuario"}</strong>
        </Link>
        <ReviewStars rating={review.rating} />
        <p>{review.comment ?? "Sin comentario"}</p>
        <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString("es-ES")}</time>
      </article>)}
    </div>
    {hasMore && (
      <div ref={sentinelRef} className="infinite-scroll-sentinel" aria-live="polite">
        <span className="loading-more">Cargando más reseñas...</span>
      </div>
    )}
  </>;
}