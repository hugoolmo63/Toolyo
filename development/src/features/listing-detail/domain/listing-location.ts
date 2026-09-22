import type { PreferredCoordinates } from "@/features/users/domain/preferred-location";

export type ListingLocationInput = {
  lat: number | null;
  lng: number | null;
  addressText: string | null;
  city: string | null;
};

/**
 * Supplies the user's base location only as the initial listing draft value.
 * Callers may replace any field before persisting the listing; listings own
 * their location independently after creation.
 */
export function defaultListingLocationFromUser(
  userLocation: PreferredCoordinates | null,
  userLabel: string | null,
): ListingLocationInput {
  return {
    lat: userLocation?.lat ?? null,
    lng: userLocation?.lng ?? null,
    addressText: null,
    city: userLabel?.trim() || null,
  };
}