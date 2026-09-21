import { describe, expect, it } from "vitest";
import { defaultListingLocationFromUser } from "@/features/listing-detail/domain/listing-location";

describe("defaultListingLocationFromUser", () => {
  it("provides a user location as an editable listing draft default", () => {
    expect(defaultListingLocationFromUser({ lat: 40.4, lng: -3.7 }, "Madrid, España")).toEqual({
      lat: 40.4, lng: -3.7, addressText: null, city: "Madrid, España",
    });
  });

  it("allows a listing to start without a shared user location", () => {
    expect(defaultListingLocationFromUser(null, null)).toEqual({ lat: null, lng: null, addressText: null, city: null });
  });
});