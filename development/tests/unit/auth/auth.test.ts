import { describe, expect, it } from "vitest";
import { deriveCapabilities } from "@/server/auth/capabilities.service";
import { normalizeEmail, normalizePhone } from "@/server/auth/normalization";
import { generateOtp } from "@/server/auth/otp.service";
import { hashPassword, verifyPassword } from "@/server/auth/password";

const base = { accountStatus: "active" as const, email: "verified" as const, phone: "verified" as const, identity: "not_started" as const };

describe("registration domain", () => {
  it("normalizes contact values without provider-specific rewriting", () => {
    expect(normalizeEmail(" Person@Example.COM ")).toBe("person@example.com");
    expect(normalizePhone("600 123 456")).toBe("+34600123456");
    expect(normalizePhone("invalid")).toBeNull();
  });

  it("hashes and verifies passwords without storing plaintext", async () => {
    const hash = await hashPassword("a secure password with 12");
    expect(hash).not.toContain("a secure password with 12");
    expect(await verifyPassword("a secure password with 12", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("generates six digit expiring OTP hashes", () => {
    const result = generateOtp("unit-test-secret");
    expect(result.code).toMatch(/^\d{6}$/);
    expect(result.codeHash).not.toBe(result.code);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("does not unlock identity capabilities before KYC approval", () => {
    expect(deriveCapabilities(base).instant_booking).toBe(false);
    expect(deriveCapabilities({ ...base, identity: "verified" }).instant_booking).toBe(true);
    expect(deriveCapabilities({ ...base, accountStatus: "suspended" }).publish_listing).toBe(false);
  });
});
