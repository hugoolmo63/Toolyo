import { describe, expect, it } from "vitest";
import { distanceBetweenCoordinatesInMeters, obfuscatePreferredLocation } from "@/features/users/domain/preferred-location";

describe("listing location privacy", () => {
  it("uses listingId as a stable jitter seed within the 750m privacy circle", () => {
    const stored = { lat: 40.416775, lng: -3.70379 };
    const first = obfuscatePreferredLocation(stored, "listing-1");
    const second = obfuscatePreferredLocation(stored, "listing-1");
    const distance = distanceBetweenCoordinatesInMeters(stored, first);
    expect(first).toEqual(second);
    expect(first).not.toEqual(stored);
    expect(distance).toBeGreaterThanOrEqual(150);
    expect(distance).toBeLessThanOrEqual(400);
    expect(distance).toBeLessThan(750);
  });
});