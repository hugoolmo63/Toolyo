import { describe, expect, it } from "vitest";
import { CreateListingManagementSchema, ListMineSchema, RemoveListingSchema } from "@/features/listing-management/shared/listing-management.schema";

const categoryId = "ckxxxxxxxxxxxxxxxxxxxxxxxxx";

const validListing = { title: "Cámara profesional", categoryId, pricePerDay: "25.50", photos: [{ url: "https://example.com/photo.jpg", order: 0 }] };

describe("listing-management schemas", () => {
  it("accepts a valid draft", () => {
    expect(CreateListingManagementSchema.parse(validListing).publish).toBe(false);
  });

  it("rejects zero, negative and malformed prices", () => {
    for (const pricePerDay of ["0", "-1", "abc", "1.12345"]) {
      expect(() => CreateListingManagementSchema.parse({ ...validListing, pricePerDay })).toThrow();
    }
  });

  it("requires a photo when publishing", () => {
    expect(() => CreateListingManagementSchema.parse({ ...validListing, photos: [], publish: true })).toThrow();
  });

  it("accepts at most 10 photos and an optional verification video URL", () => {
    const tenPhotos = Array.from({ length: 10 }, (_, order) => ({ url: `https://example.com/${order}.jpg`, order }));
    expect(CreateListingManagementSchema.parse({ ...validListing, photos: tenPhotos }).photos).toHaveLength(10);
    expect(() => CreateListingManagementSchema.parse({ ...validListing, photos: [...tenPhotos, { url: "https://example.com/extra.jpg", order: 10 }] })).toThrow();
    expect(CreateListingManagementSchema.parse({ ...validListing, verificationVideoUrl: "/uploads/listing-videos/demo.mp4" }).verificationVideoUrl).toBe("/uploads/listing-videos/demo.mp4");
  });

  it("bounds pagination and applies defaults", () => {
    expect(ListMineSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(() => ListMineSchema.parse({ pageSize: 51 })).toThrow();
  });

  it("requires explicit removal confirmation", () => {
    expect(() => RemoveListingSchema.parse({ listingId: categoryId, confirmation: false })).toThrow();
    expect(RemoveListingSchema.parse({ listingId: categoryId, confirmation: true }).confirmation).toBe(true);
  });
});
