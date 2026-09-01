import { describe, expect, it, vi, beforeEach } from "vitest";
import { searchInitial, searchQuery, searchSuggest } from "@/features/search/application/search.service";
import type { PrismaClient } from "@prisma/client";

// Mock del repositorio
vi.mock("@/features/search/infrastructure/listing.repository", () => ({
  findPublishedListingsRandom: vi.fn(),
  findPublishedListingsFiltered: vi.fn(),
  findPublishedListingsInBounds: vi.fn(),
}));

vi.mock("@/features/search/infrastructure/geocoding.repository", () => ({
  searchLocationsNominatim: vi.fn(),
}));

vi.mock("@/server/lib/geo/distance", () => ({
  haversineDistanceKm: vi.fn(() => 5.2),
}));

import { findPublishedListingsRandom, findPublishedListingsFiltered } from "@/features/search/infrastructure/listing.repository";
import { searchLocationsNominatim } from "@/features/search/infrastructure/geocoding.repository";

const mockPrisma = {} as PrismaClient;

const mockRow = {
  id: "listing-1",
  slug: "test-listing",
  title: "Cámara de prueba",
  pricePerDay: { toString: () => "50" } as any,
  lat: { toString: () => "40.4168" } as any,
  lng: { toString: () => "-3.7038" } as any,
  city: "Madrid",
  ratingAverage: { toString: () => "4.5" } as any,
  reviewCount: 10,
  viewCount: 100,
  distance_meters: null,
  ownerId: "owner-1",
  ownerDisplayName: null,
  ownerAvatarUrl: null,
  ownerIsVerified: true,
  primaryPhotoUrl: "https://example.com/photo.jpg",
};

describe("search.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("searchInitial", () => {
    it("devuelve listings publicados en orden aleatorio con seed", async () => {
      vi.mocked(findPublishedListingsRandom).mockResolvedValue({
        rows: [mockRow],
        total: 1,
      });

      const result = await searchInitial(mockPrisma, { limit: 24 });

      expect(findPublishedListingsRandom).toHaveBeenCalledWith(mockPrisma, expect.objectContaining({ limit: 24 }));
      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.id).toBe("listing-1");
      expect(result.items[0]!.title).toBe("Cámara de prueba");
      expect(result.items[0]!.pricePerDay).toBe(50);
      expect(result.items[0]!.ratingAverage).toBe(4.5);
      expect(result.items[0]!.owner.isVerified).toBe(true);
      expect(result.seed).toBeDefined();
      expect(result.total).toBe(1);
    });

    it("genera seed si no se proporciona", async () => {
      vi.mocked(findPublishedListingsRandom).mockResolvedValue({ rows: [], total: 0 });

      const result = await searchInitial(mockPrisma, { limit: 24 });

      expect(result.seed).toBeGreaterThan(0);
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("no expone datos privados en el DTO", async () => {
      vi.mocked(findPublishedListingsRandom).mockResolvedValue({
        rows: [mockRow],
        total: 1,
      });

      const result = await searchInitial(mockPrisma, { limit: 24 });

      const item = result.items[0]!;
      expect(item.owner).toBeDefined();
      expect(item.owner).not.toHaveProperty("email");
      expect(item.owner).not.toHaveProperty("phone");
      expect(item).not.toHaveProperty("addressText");
    });
  });

  describe("searchQuery", () => {
    it("delega a searchInitial si no hay criterios y sortBy es relevance", async () => {
      vi.mocked(findPublishedListingsRandom).mockResolvedValue({
        rows: [mockRow],
        total: 1,
      });

      const result = await searchQuery(mockPrisma, {
        sortBy: "relevance",
        limit: 24,
      });

      expect(findPublishedListingsRandom).toHaveBeenCalled();
      expect(findPublishedListingsFiltered).not.toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
    });

    it("usa findPublishedListingsFiltered si hay criterios", async () => {
      vi.mocked(findPublishedListingsFiltered).mockResolvedValue({
        rows: [mockRow],
        total: 1,
      });

      const result = await searchQuery(mockPrisma, {
        query: "cámara",
        sortBy: "relevance",
        limit: 24,
      });

      expect(findPublishedListingsFiltered).toHaveBeenCalledWith(mockPrisma, expect.objectContaining({ query: "cámara" }));
      expect(result.items).toHaveLength(1);
    });

    it("calcula distanceKm cuando hay location", async () => {
      vi.mocked(findPublishedListingsFiltered).mockResolvedValue({
        rows: [{ ...mockRow, distance_meters: 5000 }],
        total: 1,
      });

      const result = await searchQuery(mockPrisma, {
        location: { lat: 40.4, lng: -3.7, text: "Madrid" },
        sortBy: "nearest",
        limit: 24,
      });

      expect(result.items[0]!.distanceKm).toBe(5);
    });
  });

  describe("searchSuggest", () => {
    it("devuelve ubicaciones y categorías", async () => {
      vi.mocked(searchLocationsNominatim).mockResolvedValue([
        { text: "Madrid, España", lat: 40.4168, lng: -3.7038, type: "city" },
      ]);

      const mockFindMany = vi.fn().mockResolvedValue([
        { id: "cat-1", name: "Cámaras", slug: "camaras", parentId: null },
      ]);
      const prismaWithMock = { category: { findMany: mockFindMany } } as unknown as PrismaClient;

      const result = await searchSuggest(prismaWithMock, {
        query: "Ma",
        type: "all",
        limit: 6,
      });

      expect(result.locations).toHaveLength(1);
      expect(result.locations[0]!.text).toBe("Madrid, España");
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0]!.name).toBe("Cámaras");
    });

    it("solo devuelve ubicaciones si type es locations", async () => {
      vi.mocked(searchLocationsNominatim).mockResolvedValue([]);

      const mockFindMany = vi.fn();
      const prismaWithMock = { category: { findMany: mockFindMany } } as unknown as PrismaClient;

      const result = await searchSuggest(prismaWithMock, {
        query: "Ma",
        type: "locations",
        limit: 6,
      });

      expect(mockFindMany).not.toHaveBeenCalled();
      expect(result.categories).toHaveLength(0);
    });
  });
});
