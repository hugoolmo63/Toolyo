import { describe, expect, it } from "vitest";
import { deriveCapabilities } from "@/server/auth/capabilities.service";

describe("capabilities", () => {
  const contactVerified = { accountStatus: "active" as const, email: "verified" as const, phone: "verified" as const };

  it("keeps advanced capabilities locked until identity is verified", () => {
    expect(deriveCapabilities({ ...contactVerified, identity: "pending" }).instant_booking).toBe(false);
    expect(deriveCapabilities({ ...contactVerified, identity: "verified" }).instant_booking).toBe(true);
  });

  it("locks all capabilities for suspended accounts", () => {
    expect(deriveCapabilities({ ...contactVerified, accountStatus: "suspended", identity: "verified" }).publish_listing).toBe(false);
  });
});
