"use client";

import { useState } from "react";
import { api } from "@/lib/trpc-react";
import { ReviewStatusMessage } from "./review-status-message";

const categories = [
  ["communication", "Comunicación"],
  ["punctuality", "Puntualidad"],
  ["product_condition", "Estado del producto"],
] as const;

export function RenterReviewForm({ bookingId, onCompleted }: { bookingId: string; onCompleted?: () => void }) {
  const [overallRating, setOverallRating] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const mutation = api.reviews.createRenterReview.useMutation({ onSuccess: onCompleted });
  const isComplete = overallRating > 0 && categories.every(([key]) => (scores[key] ?? 0) > 0);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isComplete) return;
    mutation.mutate({
      bookingId,
      overallRating,
      comment: comment.trim() || undefined,
      categoryScores: categories.map(([category]) => ({ category, rating: scores[category]! })),
    });
  }

  return (
    <form className="review-form" onSubmit={submit} noValidate>
      <h2>Valora tu experiencia</h2>
      <p>Tu valoración quedará pendiente hasta que se complete el proceso de doble ciego.</p>
      <fieldset>
        <legend>Puntuación general</legend>
        <div role="radiogroup" aria-label="Puntuación general">
          {[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" aria-label={`${rating} estrellas`} aria-pressed={overallRating === rating} className={overallRating >= rating ? "star selected" : "star"} onClick={() => setOverallRating(rating)}>★</button>)}
        </div>
      </fieldset>
      {categories.map(([key, label]) => (
        <fieldset key={key}>
          <legend>{label}</legend>
          <div role="radiogroup" aria-label={label}>
            {[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" aria-label={`${label}: ${rating} estrellas`} aria-pressed={scores[key] === rating} className={scores[key] !== undefined && scores[key]! >= rating ? "star selected" : "star"} onClick={() => setScores((current) => ({ ...current, [key]: rating }))}>★</button>)}
          </div>
        </fieldset>
      ))}
      <label className="field">Comentario (opcional)<textarea className="input" rows={4} maxLength={5000} value={comment} onChange={(event) => setComment(event.target.value)} /></label>
      {mutation.error && <p role="alert" className="form-error">{mutation.error.message}</p>}
      {mutation.isSuccess && <ReviewStatusMessage status="hidden" publicationReason="awaiting_other_review" />}
      <button className="btn btn-primary" type="submit" disabled={!isComplete || mutation.isPending}>{mutation.isPending ? "Enviando…" : "Enviar valoración"}</button>
    </form>
  );
}