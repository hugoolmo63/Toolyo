import { describe, expect, it } from "vitest";
import { getListingVideoExtension, MAX_LISTING_VIDEO_BYTES } from "@/features/listing-management/shared/listing-video.schema";

describe("listing video upload validation", () => {
  it("accepts supported videos up to exactly 50 MiB", () => {
    expect(getListingVideoExtension({ type: "video/mp4", size: MAX_LISTING_VIDEO_BYTES })).toBe(".mp4");
    expect(getListingVideoExtension({ type: "video/webm", size: 1024 })).toBe(".webm");
    expect(getListingVideoExtension({ type: "video/quicktime", size: 1024 })).toBe(".mov");
  });

  it("rejects oversized, empty, and unsupported files", () => {
    expect(getListingVideoExtension({ type: "video/mp4", size: MAX_LISTING_VIDEO_BYTES + 1 })).toBeNull();
    expect(getListingVideoExtension({ type: "video/mp4", size: 0 })).toBeNull();
    expect(getListingVideoExtension({ type: "image/png", size: 100 })).toBeNull();
  });

  it("rejects a file one byte over the backend upload boundary", () => {
    expect(getListingVideoExtension({ type: "video/mp4", size: 50 * 1024 * 1024 + 1 })).toBeNull();
  });
});