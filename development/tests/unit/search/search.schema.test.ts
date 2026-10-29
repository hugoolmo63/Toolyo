import { describe, expect, it } from "vitest";
import {
  SearchQuerySchema,
  SearchMapResultsSchema,
  SearchInitialSchema,
  SuggestSchema,
  MapBoundsQuerySchema,
} from "@/features/search/shared/search.schema";

describe("search.schema", () => {
  describe("SearchMapResultsSchema", () => {
    it("accepts a complete map page with up to 1000 results", () => {
      expect(SearchMapResultsSchema.parse({ limit: 1000 }).limit).toBe(1000);
      expect(() => SearchMapResultsSchema.parse({ limit: 1001 })).toThrow();
    });
  });
  describe("SearchQuerySchema", () => {
    it("acepta input vacío con defaults", () => {
      const result = SearchQuerySchema.parse({});
      expect(result.sortBy).toBe("relevance");
      expect(result.limit).toBe(24);
    });

    it("acepta input válido con todos los campos", () => {
      const result = SearchQuerySchema.parse({
        query: "cámara",
        location: { lat: 40.4168, lng: -3.7038, text: "Madrid" },
        categoryId: "ckxxxxxxxxxxxxxxxxxxxxxxxxx",
        dateRange: { startDate: "2026-12-01", endDate: "2026-12-05" },
        maxPricePerDay: 50,
        maxDistanceKm: 10,
        minRating: 4,
        onlyVerified: true,
        sortBy: "nearest",
        page: 2,
        limit: 24,
      });
      expect(result.query).toBe("cámara");
      expect(result.location?.lat).toBe(40.4168);
    });

    it("rechaza lat fuera de rango", () => {
      expect(() =>
        SearchQuerySchema.parse({ location: { lat: 91, lng: 0, text: "X" } }),
      ).toThrow();
    });

    it("rechaza fecha mal formateada", () => {
      expect(() =>
        SearchQuerySchema.parse({ dateRange: { startDate: "invalid", endDate: "2026-12-05" } }),
      ).toThrow();
    });

    it("rechaza sortBy inválido", () => {
      expect(() => SearchQuerySchema.parse({ sortBy: "invalid" })).toThrow();
    });

    it("rechaza limit > 48", () => {
      expect(() => SearchQuerySchema.parse({ limit: 100 })).toThrow();
    });
  });

  describe("SearchInitialSchema", () => {
    it("acepta seed y limit opcionales", () => {
      const result = SearchInitialSchema.parse({});
      expect(result.limit).toBe(24);
    });

    it("rechaza limit > 48", () => {
      expect(() => SearchInitialSchema.parse({ limit: 100 })).toThrow();
    });
  });

  describe("SuggestSchema", () => {
    it("acepta query válido", () => {
      const result = SuggestSchema.parse({ query: "Mad" });
      expect(result.query).toBe("Mad");
      expect(result.type).toBe("all");
    });

    it("rechaza query < 2 chars", () => {
      expect(() => SuggestSchema.parse({ query: "M" })).toThrow();
    });

    it("rechaza limit > 12", () => {
      expect(() => SuggestSchema.parse({ query: "Mad", limit: 20 })).toThrow();
    });
  });

  describe("MapBoundsQuerySchema", () => {
    it("acepta bounds válidos", () => {
      const result = MapBoundsQuerySchema.parse({
        bounds: { north: 41, south: 40, east: 2, west: -3 },
      });
      expect(result.bounds.north).toBe(41);
      expect(result.limit).toBe(100);
    });

    it("rechaza bounds con lat > 90", () => {
      expect(() =>
        MapBoundsQuerySchema.parse({ bounds: { north: 91, south: 40, east: 2, west: -3 } }),
      ).toThrow();
    });

    it("rechaza limit > 200", () => {
      expect(() =>
        MapBoundsQuerySchema.parse({
          bounds: { north: 41, south: 40, east: 2, west: -3 },
          limit: 500,
        }),
      ).toThrow();
    });
  });
});
