import { describe, expect, it } from "vitest";
import {
  GetBySlugSchema,
  GetSimilarSchema,
  IncrementViewSchema,
  DateRangeSchema,
} from "@/features/listing-detail/shared/listing-detail.schema";

describe("listing-detail.schema", () => {
  describe("GetBySlugSchema", () => {
    it("acepta slug válido", () => {
      const result = GetBySlugSchema.parse({ slug: "mi-listing-123" });
      expect(result.slug).toBe("mi-listing-123");
    });

    it("rechaza slug vacío", () => {
      expect(() => GetBySlugSchema.parse({ slug: "" })).toThrow();
    });

    it("rechaza slug > 200 chars", () => {
      expect(() => GetBySlugSchema.parse({ slug: "a".repeat(201) })).toThrow();
    });
  });

  describe("GetSimilarSchema", () => {
    const validInput = {
      listingId: "ckxxxxxxxxxxxxxxxxxxxxxxxxx",
      categoryId: "ckyyyyyyyyyyyyyyyyyyyyyyyyy",
    };

    it("acepta input válido con defaults", () => {
      const result = GetSimilarSchema.parse(validInput);
      expect(result.limit).toBe(6);
      expect(result.city).toBeUndefined();
      expect(result.lat).toBeUndefined();
    });

    it("acepta input con city, lat, lng y limit", () => {
      const result = GetSimilarSchema.parse({
        ...validInput,
        city: "Madrid",
        lat: 40.4168,
        lng: -3.7038,
        limit: 8,
      });
      expect(result.city).toBe("Madrid");
      expect(result.lat).toBe(40.4168);
      expect(result.limit).toBe(8);
    });

    it("rechaza listingId vacío", () => {
      expect(() => GetSimilarSchema.parse({ ...validInput, listingId: "" })).toThrow();
    });

    it("acepta listingId no-cuid (seed IDs)", () => {
      const result = GetSimilarSchema.parse({ ...validInput, listingId: "seed-listing-25" });
      expect(result.listingId).toBe("seed-listing-25");
    });

    it("rechaza categoryId vacío", () => {
      expect(() => GetSimilarSchema.parse({ ...validInput, categoryId: "" })).toThrow();
    });

    it("rechaza lat fuera de rango", () => {
      expect(() => GetSimilarSchema.parse({ ...validInput, lat: 91 })).toThrow();
    });

    it("rechaza lng fuera de rango", () => {
      expect(() => GetSimilarSchema.parse({ ...validInput, lng: 181 })).toThrow();
    });

    it("rechaza limit > 12", () => {
      expect(() => GetSimilarSchema.parse({ ...validInput, limit: 20 })).toThrow();
    });

    it("rechaza limit <= 0", () => {
      expect(() => GetSimilarSchema.parse({ ...validInput, limit: 0 })).toThrow();
    });

    it("acepta city null", () => {
      const result = GetSimilarSchema.parse({ ...validInput, city: null });
      expect(result.city).toBeNull();
    });
  });

  describe("IncrementViewSchema", () => {
    it("acepta listingId cuid", () => {
      const result = IncrementViewSchema.parse({ listingId: "ckxxxxxxxxxxxxxxxxxxxxxxxxx" });
      expect(result.listingId).toBe("ckxxxxxxxxxxxxxxxxxxxxxxxxx");
    });

    it("acepta listingId no-cuid (seed IDs)", () => {
      const result = IncrementViewSchema.parse({ listingId: "seed-listing-25" });
      expect(result.listingId).toBe("seed-listing-25");
    });

    it("rechaza listingId vacío", () => {
      expect(() => IncrementViewSchema.parse({ listingId: "" })).toThrow();
    });
  });

  describe("DateRangeSchema", () => {
    it("acepta rango válido (end > start)", () => {
      const result = DateRangeSchema.parse({ start: "2026-09-01", end: "2026-09-05" });
      expect(result.start).toBe("2026-09-01");
      expect(result.end).toBe("2026-09-05");
    });

    it("rechaza end < start", () => {
      expect(() =>
        DateRangeSchema.parse({ start: "2026-09-05", end: "2026-09-01" }),
      ).toThrow();
    });

    it("rechaza end = start", () => {
      expect(() =>
        DateRangeSchema.parse({ start: "2026-09-01", end: "2026-09-01" }),
      ).toThrow();
    });

    it("rechaza fecha mal formateada", () => {
      expect(() =>
        DateRangeSchema.parse({ start: "invalid", end: "2026-09-05" }),
      ).toThrow();
    });

    it("rechaza start mal formateada", () => {
      expect(() =>
        DateRangeSchema.parse({ start: "2026/09/01", end: "2026-09-05" }),
      ).toThrow();
    });
  });
});
