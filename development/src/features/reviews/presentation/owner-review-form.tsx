"use client";

import { useState } from "react";
import { api } from "@/lib/trpc-react";
import { ReviewStatusMessage } from "./review-status-message";

const categories = [["communication", "Comunicación"], ["punctuality", "Puntualidad"], ["product_care", "Cuidado del producto"]] as const;

export function OwnerReviewForm({ bookingId, onCompleted }: { bookingId: string; onCompleted?: () => void }) {
  const [overallRating, setOverallRating] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const mutation = api.reviews.createOwnerReview.useMutation({ onSuccess: onCompleted });
  const complete = overallRating > 0 && categories.every(([key]) => (scores[key] ?? 0) > 0);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!complete) return;
    mutation.mutate({ bookingId, overallRating, comment: comment.trim() || undefined, categoryScores: categories.map(([category]) => ({ category, rating: scores[category]! })) });
  }
  return <form className="review-form" onSubmit={submit} noValidate>
    <h2>Valora al arrendatario</h2>
    <p>La valoración quedará oculta hasta completar el doble ciego.</p>
    <fieldset><legend>Puntuación general</legend><div role="radiogroup" aria-label="Puntuación general">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" className={overallRating >= rating ? "star selected" : "star"} aria-label={`${rating} estrellas`} aria-pressed={overallRating === rating} onClick={() => setOverallRating(rating)}>★</button>)}</div></fieldset>
    {categories.map(([key, label]) => <fieldset key={key}><legend>{label}</legend><div role="radiogroup" aria-label={label}>{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" className={(scores[key] ?? 0) >= rating ? "star selected" : "star"} aria-label={`${label}: ${rating} estrellas`} aria-pressed={scores[key] === rating} onClick={() => setScores((current) => ({ ...current, [key]: rating }))}>★</button>)}</div></fieldset>)}
    <label className="field">Comentario (opcional)<textarea className="input" rows={4} maxLength={5000} value={comment} onChange={(event) => setComment(event.target.value)} /></label>
    {mutation.error && <p role="alert" className="form-error">{mutation.error.message}</p>}
    {mutation.isSuccess && <ReviewStatusMessage status="hidden" publicationReason="awaiting_other_review" />}
    <button className="btn btn-primary" type="submit" disabled={!complete || mutation.isPending}>{mutation.isPending ? "Enviando…" : "Enviar valoración"}</button>
  </form>;
}