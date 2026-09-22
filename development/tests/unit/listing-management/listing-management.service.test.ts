import { describe, expect, it } from "vitest";
import { noActiveCommitments } from "@/features/listing-management/application/active-commitments.port";

describe("listing-management service dependencies", () => {
  it("defaults to no active commitments until bookings are available", async () => {
    await expect(noActiveCommitments.countForListing("listing-1")).resolves.toEqual({ pendingRequests: 0, activeRentals: 0 });
  });
});
