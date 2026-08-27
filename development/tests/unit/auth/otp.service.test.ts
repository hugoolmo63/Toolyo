import { describe, expect, it } from "vitest";
import { generateOtp } from "@/server/auth/otp.service";

describe("OTP service", () => {
  it("generates six digits and stores only a digest", () => {
    const otp = generateOtp("unit-test-secret");
    expect(otp.code).toMatch(/^\d{6}$/);
    expect(otp.codeHash).not.toBe(otp.code);
    expect(otp.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
