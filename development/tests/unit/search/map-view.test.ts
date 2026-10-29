import { describe, expect, it } from "vitest";
import { getMapListingHref, getMapPinsWithCoordinates } from "@/features/search/presentation/map-view";
import type { MapPin } from "@/types/search";

describe("map marker rendering input", () => {
  it("builds the listing detail URL from the real listing id", () => {
    expect(getMapListingHref("cm123realListingId")).toBe("/listings/cm123realListingId");
  });

  it("retains one marker for every result that has coordinates, including all 90 matches", () => {
    const pins = Array.from({ length: 90 }, (_, index): MapPin => ({
      id: `listing-${index}`,
      lat: 40 + index / 1000,
      lng: -3 - index / 1000,
      title: `Cámara ${index}`,
      pricePerDay: 20,
      primaryPhotoUrl: null,
      ratingAverage: 0,
    }));
    pins.push({ ...pins[0]!, id: "no-coordinates", lat: Number.NaN });

    expect(getMapPinsWithCoordinates(pins)).toHaveLength(90);
  });
});