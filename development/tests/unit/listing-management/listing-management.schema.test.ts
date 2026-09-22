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

  it("bounds pagination and applies defaults", () => {
    expect(ListMineSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(() => ListMineSchema.parse({ pageSize: 51 })).toThrow();
  });

  it("requires explicit removal confirmation", () => {
    expect(() => RemoveListingSchema.parse({ listingId: categoryId, confirmation: false })).toThrow();
    expect(RemoveListingSchema.parse({ listingId: categoryId, confirmation: true }).confirmation).toBe(true);
  });
});
