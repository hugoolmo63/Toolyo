import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getListingBySlug,
  getSimilarListings,
  incrementView,
  clearViewDedupCache,
} from "@/features/listing-detail/application/listing-detail.service";
import {
  calculatePriceEstimate,
  daysBetween,
  getApplicableTier,
  derivePriceTiers,
} from "@/features/listing-detail/domain/price-tiers";
import type { PrismaClient } from "@prisma/client";

// Mock del repositorio
vi.mock("@/features/listing-detail/infrastructure/listing-detail.repository", () => ({
  findListingBySlug: vi.fn(),
  findPhotosByListingId: vi.fn(),
  findAvailabilityByListingId: vi.fn(),
  findReviewsByListingId: vi.fn(),
  findSimilarListings: vi.fn(),
  incrementListingView: vi.fn(),
}));

import {
  findListingBySlug,
  findPhotosByListingId,
  findAvailabilityByListingId,
  findReviewsByListingId,
  findSimilarListings,
  incrementListingView,
} from "@/features/listing-detail/infrastructure/listing-detail.repository";

const mockPrisma = {} as PrismaClient;

const mockDetailRow = {
  id: "listing-1",
  slug: "test-listing",
  title: "Cámara de prueba",
  description: "Una cámara excelente",
  pricePerDay: { toString: () => "50" } as any,
  lat: { toString: () => "40.4168" } as any,
  lng: { toString: () => "-3.7038" } as any,
  addressText: "Centro",
  city: "Madrid",
  ratingAverage: { toString: () => "4.5" } as any,
  reviewCount: 10,
  viewCount: 100,
  isInstantBooking: true,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  categoryId: "cat-1",
  categoryName: "Cámaras",
  categorySlug: "camaras",
  ownerId: "owner-1",
  ownerDisplayName: "Ana García",
  ownerAvatarUrl: "https://i.pravatar.cc/150?img=1",
  ownerIsVerified: true,
  ownerRatingAverage: { toString: () => "4.8" } as any,
  ownerResponseTimeHours: 2,
  ownerTransactionCount: 47,
};

const mockPhotos = [
  { id: "photo-1", url: "https://example.com/1.jpg", altText: "Foto 1", order: 0 },
  { id: "photo-2", url: "https://example.com/2.jpg", altText: "Foto 2", order: 1 },
];

const mockAvailability = [
  { blockedDate: new Date("2026-12-25T00:00:00Z") },
];

const mockSimilarRows = [
  {
    id: "similar-1",
    slug: "similar-listing-1",
    title: "Similar 1",
    pricePerDay: { toString: () => "40" } as any,
    ratingAverage: { toString: () => "4.0" } as any,
    reviewCount: 5,
    city: "Madrid",
    primaryPhotoUrl: "https://example.com/sim1.jpg",
  },
];

describe("listing-detail.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearViewDedupCache();
  });

  describe("getListingBySlug", () => {
    it("devuelve ListingDetailDTO con todos los campos públicos para un listing publicado", async () => {
      vi.mocked(findListingBySlug).mockResolvedValue(mockDetailRow);
      vi.mocked(findPhotosByListingId).mockResolvedValue(mockPhotos);
      vi.mocked(findAvailabilityByListingId).mockResolvedValue(mockAvailability);
      vi.mocked(findReviewsByListingId).mockResolvedValue([]);

      const result = await getListingBySlug(mockPrisma, { slug: "test-listing" });

      expect(result).not.toBeNull();
      expect(result!.id).toBe("listing-1");
      expect(result!.slug).toBe("test-listing");
      expect(result!.title).toBe("Cámara de prueba");
      expect(result!.description).toBe("Una cámara excelente");
      expect(result!.pricePerDay).toBe(50);
      expect(result!.location).not.toEqual({ lat: 40.4168, lng: -3.7038 });
      expect(result!.location).not.toBeNull();
      expect(result!.addressText).toBe("Centro");
      expect(result!.city).toBe("Madrid");
      expect(result!.ratingAverage).toBe(4.5);
      expect(result!.reviewCount).toBe(10);
      expect(result!.viewCount).toBe(100);
      expect(result!.isInstantBooking).toBe(true);
      expect(result!.category).toEqual({ id: "cat-1", name: "Cámaras", slug: "camaras", parentId: null, parentName: null });
      expect(result!.owner.id).toBe("owner-1");
      expect(result!.owner.isVerified).toBe(true);
      expect(result!.photos).toHaveLength(2);
      expect(result!.photos[0]!.url).toBe("https://example.com/1.jpg");
      expect(result!.availability).toEqual(["2026-12-25"]);
      expect(result!.priceTiers).toHaveLength(3);
      expect(result!.priceTiers[0]!.days).toBe(1);
      expect(result!.priceTiers[1]!.days).toBe(3);
      expect(result!.priceTiers[2]!.days).toBe(7);
    });

    it("devuelve null para listing inexistente", async () => {
      vi.mocked(findListingBySlug).mockResolvedValue(null);

      const result = await getListingBySlug(mockPrisma, { slug: "no-existe" });

      expect(result).toBeNull();
    });

    it("devuelve null para listing en estado draft", async () => {
      vi.mocked(findListingBySlug).mockResolvedValue(null); // repositorio filtra por status=published

      const result = await getListingBySlug(mockPrisma, { slug: "draft-slug" });

      expect(result).toBeNull();
    });

    it("mapeo a DTO no incluye datos privados", async () => {
      vi.mocked(findListingBySlug).mockResolvedValue(mockDetailRow);
      vi.mocked(findPhotosByListingId).mockResolvedValue([]);
      vi.mocked(findAvailabilityByListingId).mockResolvedValue([]);
      vi.mocked(findReviewsByListingId).mockResolvedValue([]);

      const result = await getListingBySlug(mockPrisma, { slug: "test-listing" });

      expect(result).not.toBeNull();
      expect(result!.owner).not.toHaveProperty("email");
      expect(result!.owner).not.toHaveProperty("phone");
      expect(result!.owner).not.toHaveProperty("emailNormalized");
      expect(result!.owner).not.toHaveProperty("phoneE164");
    });

    it("priceTiers derivados correctamente desde pricePerDay", async () => {
      vi.mocked(findListingBySlug).mockResolvedValue(mockDetailRow);
      vi.mocked(findPhotosByListingId).mockResolvedValue([]);
      vi.mocked(findAvailabilityByListingId).mockResolvedValue([]);

      const result = await getListingBySlug(mockPrisma, { slug: "test-listing" });

      expect(result!.priceTiers[0]!.pricePerDay).toBe(50); // 0% descuento
      expect(result!.priceTiers[1]!.pricePerDay).toBe(47.5); // 5% descuento
      expect(result!.priceTiers[2]!.pricePerDay).toBe(45); // 10% descuento
    });

    it("availability contiene solo fechas bloqueadas futuras en ISO date", async () => {
      vi.mocked(findListingBySlug).mockResolvedValue(mockDetailRow);
      vi.mocked(findPhotosByListingId).mockResolvedValue([]);
      vi.mocked(findAvailabilityByListingId).mockResolvedValue([
        { blockedDate: new Date("2026-12-25T00:00:00Z") },
        { blockedDate: new Date("2026-12-31T00:00:00Z") },
      ]);

      const result = await getListingBySlug(mockPrisma, { slug: "test-listing" });

      expect(result!.availability).toEqual(["2026-12-25", "2026-12-31"]);
    });
  });

  describe("getSimilarListings", () => {
    it("devuelve hasta 6 listings de misma categoría", async () => {
      vi.mocked(findSimilarListings).mockResolvedValue(mockSimilarRows);

      const result = await getSimilarListings(mockPrisma, {
        listingId: "listing-1",
        categoryId: "cat-1",
        city: "Madrid",
        lat: 40.4168,
        lng: -3.7038,
        limit: 6,
      });

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe("similar-1");
      expect(result[0]!.pricePerDay).toBe(40);
    });

    it("excluye el listing actual (lo hace el repositorio)", async () => {
      vi.mocked(findSimilarListings).mockResolvedValue([]);

      await getSimilarListings(mockPrisma, {
        listingId: "listing-1",
        categoryId: "cat-1",
        limit: 6,
      });

      expect(findSimilarListings).toHaveBeenCalledWith(
        mockPrisma,
        expect.objectContaining({ listingId: "listing-1" }),
      );
    });
  });

  describe("incrementView", () => {
    it("incrementa viewCount en 1 la primera vez", async () => {
      vi.mocked(incrementListingView).mockResolvedValue(undefined);

      const result = await incrementView(mockPrisma, "listing-1", "1.2.3.4");

      expect(result).toEqual({ ok: true });
      expect(incrementListingView).toHaveBeenCalledTimes(1);
    });

    it("deduplica por IP en ventana de 30 min (segunda llamada no incrementa)", async () => {
      vi.mocked(incrementListingView).mockResolvedValue(undefined);

      await incrementView(mockPrisma, "listing-1", "1.2.3.4");
      await incrementView(mockPrisma, "listing-1", "1.2.3.4");

      expect(incrementListingView).toHaveBeenCalledTimes(1);
    });

    it("no propaga errores del repositorio", async () => {
      vi.mocked(incrementListingView).mockRejectedValue(new Error("DB down"));

      const result = await incrementView(mockPrisma, "listing-1", "1.2.3.4");

      expect(result).toEqual({ ok: true });
    });
  });

  describe("validación de rango de fechas contra availability (T031)", () => {
    it("rango sin bloqueos → isValid true y blockedDatesInRange vacío", () => {
      const est = calculatePriceEstimate(100, "2026-09-01", "2026-09-04", []);
      expect(est.isValid).toBe(true);
      expect(est.blockedDatesInRange).toEqual([]);
    });

    it("rango con bloqueos → isValid false con blockedDatesInRange correcto", () => {
      const est = calculatePriceEstimate(
        100,
        "2026-09-01",
        "2026-09-05",
        ["2026-09-02", "2026-09-10"],
      );
      expect(est.isValid).toBe(false);
      expect(est.blockedDatesInRange).toEqual(["2026-09-02"]);
    });

    it("rango con todos los días bloqueados → isValid false con todas las fechas", () => {
      const est = calculatePriceEstimate(
        100,
        "2026-09-01",
        "2026-09-03",
        ["2026-09-01", "2026-09-02", "2026-09-03"],
      );
      expect(est.isValid).toBe(false);
      expect(est.blockedDatesInRange).toHaveLength(3);
    });

    it("PriceEstimate para 1 día usa tramo 1d (sin descuento)", () => {
      const est = calculatePriceEstimate(100, "2026-09-01", "2026-09-02", []);
      expect(est.days).toBe(1);
      expect(est.applicableTier.days).toBe(1);
      expect(est.total).toBe(100);
    });

    it("PriceEstimate para 3 días usa tramo 3d (5% descuento)", () => {
      const est = calculatePriceEstimate(100, "2026-09-01", "2026-09-04", []);
      expect(est.days).toBe(3);
      expect(est.applicableTier.days).toBe(3);
      expect(est.total).toBe(285);
    });

    it("PriceEstimate para 5 días usa tramo 7d (10% descuento)", () => {
      const est = calculatePriceEstimate(100, "2026-09-01", "2026-09-06", []);
      expect(est.days).toBe(5);
      expect(est.applicableTier.days).toBe(7);
      expect(est.total).toBe(450);
    });

    it("PriceEstimate para 7 días usa tramo 7d (10% descuento)", () => {
      const est = calculatePriceEstimate(100, "2026-09-01", "2026-09-08", []);
      expect(est.days).toBe(7);
      expect(est.applicableTier.days).toBe(7);
      expect(est.total).toBe(630);
    });

    it("calculatePriceEstimate con rango vacío devuelve isValid false", () => {
      const est = calculatePriceEstimate(100, "2026-09-01", "2026-09-01", []);
      expect(est.isValid).toBe(false);
      expect(est.days).toBe(0);
      expect(est.total).toBe(0);
    });

    it("daysBetween calcula correctamente entre dos fechas", () => {
      expect(daysBetween("2026-09-01", "2026-09-04")).toBe(3);
    });

    it("getApplicableTier devuelve tramo correcto según días", () => {
      const tiers = derivePriceTiers(100);
      expect(getApplicableTier(1, tiers).days).toBe(1);
      expect(getApplicableTier(2, tiers).days).toBe(3);
      expect(getApplicableTier(3, tiers).days).toBe(3);
      expect(getApplicableTier(4, tiers).days).toBe(7);
      expect(getApplicableTier(7, tiers).days).toBe(7);
      expect(getApplicableTier(10, tiers).days).toBe(7);
    });
  });
});
