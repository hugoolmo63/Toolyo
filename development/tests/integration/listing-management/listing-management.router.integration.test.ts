import { describe, expect, it } from "vitest";
import { ListMineSchema, RemoveListingSchema } from "@/features/listing-management/shared/listing-management.schema";

describe("listing-management contract boundaries", () => {
  it("keeps pagination and destructive confirmation explicit at the contract boundary", () => {
    expect(ListMineSchema.parse({ page: 1, pageSize: 20 }).pageSize).toBe(20);
    expect(() => RemoveListingSchema.parse({ listingId: "not-a-cuid", confirmation: true })).toThrow();
  });
});
