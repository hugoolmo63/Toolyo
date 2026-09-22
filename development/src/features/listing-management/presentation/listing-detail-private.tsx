"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc-react";
import { ListingStatusBadge } from "./listing-status-badge";
import { ListingDeleteDialog } from "./listing-delete-dialog";

type ListingDetail = { id: string; title: string; description: string | null; pricePerDay: string; status: string; category: { name: string }; location: { city: string | null; addressText: string | null }; photos: Array<{ id: string; url: string; altText: string | null; order: number }>; activeCommitments: { pendingRequests: number; activeRentals: number } };

export function ListingDetailPrivate({ listing }: { listing: ListingDetail }) {
  const router = useRouter();
  const publishMutation = api.listingManagement.publish.useMutation({ onSuccess: () => router.refresh() });

  return (
    <main className="listing-detail-private">
      <Link href="/dashboard/products" className="back-link">← Volver a mis productos</Link>
      <div className="listing-detail-head">
        <div>
          <h1>{listing.title}</h1>
          <p className="page-subtitle">{listing.category.name} · {listing.pricePerDay} €/día</p>
        </div>
        <ListingStatusBadge status={listing.status} />
      </div>
      {listing.photos.length > 0 && (
        <div className="detail-photos">
          {listing.photos.map((photo) => (
            <img key={photo.id} src={photo.url} alt={photo.altText ?? ""} width={180} height={120} className="detail-photo" />
          ))}
        </div>
      )}
      <section>
        <h2>Descripción</h2>
        <p>{listing.description || "Sin descripción todavía."}</p>
        <p className="page-subtitle">Ubicación aproximada: {listing.location.city || listing.location.addressText || "No indicada"}</p>
      </section>
      {(listing.status === "draft" || listing.status === "paused" || listing.status === "rejected") && (
        <div>
          <button type="button" className="btn btn-primary" disabled={publishMutation.isPending} onClick={() => publishMutation.mutate({ listingId: listing.id })}>
            Publicar producto
          </button>
        </div>
      )}
      {publishMutation.error && <p role="alert" className="form-error">{publishMutation.error.message}</p>}
      <div className="form-actions">
        <Link href={`/dashboard/products/${listing.id}/edit`} className="btn btn-secondary">Editar producto</Link>
        <ListingDeleteDialog listingId={listing.id} title={listing.title} />
      </div>
    </main>
  );
}
