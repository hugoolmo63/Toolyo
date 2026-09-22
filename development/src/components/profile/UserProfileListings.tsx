import type { PublicListingCard } from "@/features/users/domain/public-user-profile";
import { ListingCard } from "./ListingCard";

export function UserProfileListings({ listings }: { listings: PublicListingCard[] }) {
  if (listings.length === 0) return <p className="user-profile-empty">Este usuario todavía no tiene listings activos.</p>;
  return <div className="user-profile-listings">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>;
}