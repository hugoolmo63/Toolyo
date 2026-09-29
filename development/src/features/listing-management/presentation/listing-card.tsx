import Link from "next/link";
import Image from "next/image";
import { ListingStatusBadge } from "./listing-status-badge";
import { ListingDeleteDialog } from "./listing-delete-dialog";

type ListingCardData = {
  id: string;
  title: string;
  primaryPhotoUrl: string | null;
  category: { name: string };
  pricePerDay: string;
  status: string;
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  return (
    <article className="listing-card-item">
      {listing.primaryPhotoUrl ? (
        <Image src={listing.primaryPhotoUrl} alt="" width={96} height={72} unoptimized className="listing-card-thumb" />
      ) : (
        <div aria-label="Sin imagen" className="listing-card-thumb-empty">Sin imagen</div>
      )}
      <div>
        <h2 className="listing-card-title">
          <Link href={`/dashboard/products/${listing.id}`}>{listing.title}</Link>
        </h2>
        <p className="listing-card-meta">{listing.category.name} · {listing.pricePerDay} €/día</p>
      </div>
      <ListingStatusBadge status={listing.status} />
      <div className="listing-card-actions">
        <Link href={`/dashboard/products/${listing.id}/edit`} className="btn btn-ghost btn-sm">Modificar</Link>
        <ListingDeleteDialog listingId={listing.id} title={listing.title} />
      </div>
    </article>
  );
}
