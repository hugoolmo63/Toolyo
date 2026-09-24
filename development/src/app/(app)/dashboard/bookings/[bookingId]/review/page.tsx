import { redirect } from "next/navigation";
import { createServerApi } from "@/lib/server-api";
import { RenterReviewForm } from "@/features/reviews/presentation/review-form";
import { OwnerReviewForm } from "@/features/reviews/presentation/owner-review-form";

export default async function RenterReviewPage({ params }: { params: { bookingId: string } }) {
  const api = await createServerApi();
  const session = await api.auth.getSession();
  if (!session) redirect(`/auth?tab=login&callback=/dashboard/bookings/${params.bookingId}/review`);
  const pending = await api.reviews.getPendingForBooking({ bookingId: params.bookingId }).catch(() => null);
  const ownerStatus = await api.reviews.getOwnerReviewStatus({ bookingId: params.bookingId }).catch(() => null);
  if (!pending && !ownerStatus) return <main className="dashboard-page"><h1>Valoración</h1><p>No tienes acceso a esta reserva.</p></main>;
  if (ownerStatus) {
    if (!ownerStatus.eligible || ownerStatus.status !== "pending") return <main className="dashboard-page"><h1>Valoración del arrendatario</h1><p>Esta reserva no admite una nueva valoración.</p><p>Estado: {ownerStatus.status}</p></main>;
    return <main className="dashboard-page"><OwnerReviewForm bookingId={params.bookingId} /></main>;
  }
  if (!pending!.eligible || pending!.status !== "pending") return <main className="dashboard-page"><h1>Valoración</h1><p>Esta reserva no admite una nueva valoración.</p><p>Estado: {pending!.status}</p></main>;
  return <main className="dashboard-page"><RenterReviewForm bookingId={params.bookingId} /></main>;
}