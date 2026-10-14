import { afterEach, describe, expect, it, vi } from "vitest";
import { clearGeocodingCache, searchLocationsNominatim } from "@/features/search/infrastructure/geocoding.repository";

const nominatimResults = [
  {
    display_name: "Valencia, Valencia, Comunidad Valenciana, España",
    lat: "39.4699",
    lon: "-0.3763",
    type: "city",
    address: { city: "Valencia", province: "Valencia", state: "Comunidad Valenciana" },
  },
  {
    display_name: "A Coruña, A Coruña, Galicia, España",
    lat: "43.3623",
    lon: "-8.4115",
    type: "administrative",
    address: { city: "A Coruña", province: "A Coruña", state: "Galicia" },
  },
  {
    display_name: "Rúa Nova, 12, Santiago de Compostela, A Coruña, Galicia, España",
    lat: "42.8782",
    lon: "-8.5448",
    type: "house",
    address: { house_number: "12", road: "Rúa Nova", city: "Santiago de Compostela", province: "A Coruña", state: "Galicia" },
  },
  {
    display_name: "Hotel particular, Calle Mayor, Madrid, España",
    lat: "40.4168",
    lon: "-3.7038",
    type: "building",
    address: { building: "Hotel particular", road: "Calle Mayor", city: "Madrid", state: "Comunidad de Madrid" },
  },
];

describe("searchLocationsNominatim", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearGeocodingCache();
  });

  it("formats place suggestions as city and region, excluding street-level results", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => nominatimResults,
    }));

    const suggestions = await searchLocationsNominatim("Valencia", 5);

    expect(suggestions).toEqual([
      { text: "Valencia, Comunidad Valenciana", lat: 39.4699, lng: -0.3763, type: "city" },
      { text: "A Coruña, Galicia", lat: 43.3623, lng: -8.4115, type: "administrative" },
    ]);
  });

  it("requests address details and prioritizes city-level results from Nominatim", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetchMock);

    await searchLocationsNominatim("Valencia", 5);

    const requestedUrl = new URL(fetchMock.mock.calls[0]![0] as string);
    expect(requestedUrl.searchParams.get("addressdetails")).toBe("1");
    expect(requestedUrl.searchParams.get("featuretype")).toBe("city");
  });

  it("keeps administrative regions and drops results with invalid coordinates", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { display_name: "Galicia, España", lat: "43", lon: "-8", type: "administrative", address: { state: "Galicia" } },
        { display_name: "Madrid, España", lat: "bad", lon: "-3", type: "city", address: { city: "Madrid", state: "Comunidad de Madrid" } },
      ],
    }));

    await expect(searchLocationsNominatim("Galicia", 5)).resolves.toEqual([
      { text: "Galicia", lat: 43, lng: -8, type: "administrative" },
    ]);
  });

  it("deduplicates formatted labels and prefers cities over their generic region", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: "43.3623",
          lon: "-8.4115",
          type: "city",
          address: { city: "A Coruña", province: "A Coruña", state: "Galicia" },
        },
        {
          lat: "43.36",
          lon: "-8.41",
          type: "administrative",
          address: { city: "A CORUÑA", province: "A Coruña", state: "Galicia" },
        },
        {
          lat: "42.8",
          lon: "-8.5",
          type: "administrative",
          address: { state: "Galicia" },
        },
        {
          lat: "40.4",
          lon: "-3.7",
          type: "administrative",
          address: { state: "Asturias" },
        },
      ],
    }));

    await expect(searchLocationsNominatim("Galicia", 5)).resolves.toEqual([
      { text: "A Coruña, Galicia", lat: 43.3623, lng: -8.4115, type: "city" },
      { text: "Asturias", lat: 40.4, lng: -3.7, type: "administrative" },
    ]);
  });
});