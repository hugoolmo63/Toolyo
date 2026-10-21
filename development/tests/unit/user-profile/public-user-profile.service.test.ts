import { describe, expect, it, vi } from "vitest";
import { getPublicUserProfile } from "@/features/users/application/public-user-profile.service";
import { findPublicUserProfileRecord } from "@/features/users/infrastructure/public-user-profile.repository";
import { publicProfileRecord } from "./fixtures";

vi.mock("@/features/users/infrastructure/public-user-profile.repository", () => ({
  findPublicUserProfileRecord: vi.fn(),
}));

describe("public user profile service", () => {
  it("maps public fields, badges, coordinates and active listings", async () => {
    vi.mocked(findPublicUserProfileRecord).mockResolvedValue(publicProfileRecord() as never);
    const result = await getPublicUserProfile("cuid-user-profile-1", {} as never);
    expect(result.badges).toEqual({ registered: true, verified: true, superLessor: false });
    expect(result.preferredLocation).toBe(publicProfileRecord().preferredLocation);
    expect(result.listings[0]).toMatchObject({ title: "Cámara Pro", coverImageUrl: "https://example.com/listing.jpg" });
    expect(result).not.toHaveProperty("email");
    expect(result).not.toHaveProperty("phoneE164");
  });


  it("returns an empty approximate location for invalid coordinates", async () => {
    const record = publicProfileRecord();
    record.preferredLocation = "not-a-coordinate";
    vi.mocked(findPublicUserProfileRecord).mockResolvedValue(record as never);
    const result = await getPublicUserProfile(record.id, {} as never);
    expect(result.preferredLocation).toBe("not-a-coordinate");
  });

  it("calculates the profile rating as the average of rated product ratings", async () => {
    const record = publicProfileRecord();
    record.listings.push({
      ...record.listings[0]!,
      id: "listing-2",
      ratingAverage: { toString: () => "3.5" } as never,
      reviewCount: 2,
    });
    record.listings.push({
      ...record.listings[0]!,
      id: "listing-3",
      ratingAverage: { toString: () => "0" } as never,
      reviewCount: 0,
      reviews: [],
    });
    vi.mocked(findPublicUserProfileRecord).mockResolvedValue(record as never);

    const result = await getPublicUserProfile(record.id, {} as never);

    expect(result.ratingAverage).toBe(4.1);
  });
});