import Image from "next/image";
import Link from "next/link";
import type { PublicListingCard as Listing } from "@/features/users/domain/public-user-profile";

export function ListingCard({ listing }: { listing: Listing }) {
  return <Link href={`/listings/${listing.slug}`} className="user-profile-listing-card">
    <div className="user-profile-listing-image">{listing.coverImageUrl ? <Image src={listing.coverImageUrl} alt="" fill unoptimized sizes="(max-width: 600px) 100vw, 33vw" /> : <span aria-hidden="true">{listing.title.slice(0, 1)}</span>}</div>
    <div className="user-profile-listing-content"><h3>{listing.title}</h3><p>{listing.city ?? "Ubicación no especificada"}</p><strong>{listing.pricePerDay} € <small>/día</small></strong></div>
  </Link>;
}