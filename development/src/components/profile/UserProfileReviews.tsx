"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicReview } from "@/features/users/domain/public-user-profile";

function ReviewStars({ rating }: { rating: number }) {
  return <span className="review-stars" aria-label={`Valoración ${rating} de 5`}>
    {Array.from({ length: 5 }, (_, index) => <svg key={index} viewBox="0 0 20 20" aria-hidden="true" className={index < rating ? "filled" : "empty"}><path d="M10 1.5l2.62 5.3 5.85.85-4.23 4.12 1 5.83L10 14.85l-5.24 2.75 1-5.83L1.53 7.65l5.85-.85L10 1.5z" /></svg>)}
  </span>;
}

export function UserProfileReviews({ reviews }: { reviews: PublicReview[] }) {
  const [visibleCount, setVisibleCount] = useState(5);
  const visibleReviews = reviews.slice(0, visibleCount);
  return <section className="user-profile-reviews" aria-labelledby="profile-reviews-title"><h2 id="profile-reviews-title">Reseñas</h2>
    {reviews.length === 0 ? <p className="user-profile-empty">Aún no hay reseñas.</p> : <>
      <div className="user-profile-review-list">{visibleReviews.map((review) => <article key={review.id} className="user-profile-review">
        <Link href={`/users/${review.author.id}`} className="profile-review-author">
          {review.author.avatarUrl ? <img src={review.author.avatarUrl} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span aria-hidden="true">{review.author.displayName?.slice(0, 1) ?? "U"}</span>}
          <strong>{review.author.displayName ?? "Usuario"}</strong>
        </Link>
        <ReviewStars rating={review.rating} />
        <p>Producto: <Link href={`/listings/${review.listing.slug}`} className="profile-review-listing-link">{review.listing.title}</Link></p>
        <p>{review.comment ?? "Sin comentario"}</p>{review.status === "under_review" && <p className="review-moderation-status" role="status">Esta reseña está siendo revisada y sigue visible mientras se resuelve el reporte.</p>}<time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString("es-ES")}</time>
      </article>)}</div>
      {visibleCount < reviews.length && <button type="button" className="reviews-load-more" onClick={() => setVisibleCount((count) => count + 10)}>Cargar más</button>}
    </>}
  </section>;
}