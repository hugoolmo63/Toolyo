import { describe, expect, it } from "vitest";
import {
  distanceBetweenCoordinatesInMeters,
  obfuscatePreferredLocation,
  formatPreferredLocationLabel,
  parsePreferredLocation,
} from "@/features/users/domain/preferred-location";

describe("parsePreferredLocation", () => {
  it.each([
    ["40.416775,-3.703790", { lat: 40.416775, lng: -3.70379 }],
    ['{"latitude":40.416775,"longitude":-3.703790}', { lat: 40.416775, lng: -3.70379 }],
    [{ latitude: 40.416775, longitude: -3.70379 }, { lat: 40.416775, lng: -3.70379 }],
    [{ type: "Point", coordinates: [-3.70379, 40.416775] }, { lat: 40.416775, lng: -3.70379 }],
    ['{"type":"Point","coordinates":[-3.70379,40.416775]}', { lat: 40.416775, lng: -3.70379 }],
    ["POINT(-3.703790 40.416775)", { lat: 40.416775, lng: -3.70379 }],
  ])("parses %s", (input, expected) => {
    expect(parsePreferredLocation(input)).toEqual(expected);
  });

  it("rejects invalid coordinates", () => {
    expect(parsePreferredLocation('{"latitude":100,"longitude":0}')).toBeNull();
    expect(parsePreferredLocation(null)).toBeNull();
  });

  it("formats only textual city labels and hides coordinate payloads", () => {
    expect(formatPreferredLocationLabel("Madrid, España")).toBe("Madrid, España");
    expect(formatPreferredLocationLabel('{"latitude":40.4,"longitude":-3.7}')).toBeNull();
    expect(formatPreferredLocationLabel('{"city":"Madrid","country":"España"}')).toBe("Madrid");
    expect(formatPreferredLocationLabel("40.4,-3.7")).toBeNull();
  });

  it("generates a deterministic public jitter within the privacy bounds", () => {
    const stored = { lat: 40.416775, lng: -3.70379 };
    const first = obfuscatePreferredLocation(stored, "user-1");
    const second = obfuscatePreferredLocation(stored, "user-1");
    const distance = distanceBetweenCoordinatesInMeters(stored, first);
    expect(first).toEqual(second);
    expect(first).not.toEqual(stored);
    expect(distance).toBeGreaterThanOrEqual(150);
    expect(distance).toBeLessThanOrEqual(400);
    expect(distance).toBeLessThan(750);
  });
});