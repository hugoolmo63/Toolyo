import { beforeEach, describe, expect, it } from "vitest";
import { generate } from "otplib";
import { createTotpSecret, createTotpUri, verifyTotpCode } from "@/features/admin/infrastructure/totp.provider";
import { decryptTotpSecret, encryptTotpSecret } from "@/features/admin/application/totp.service";
import { resetRateLimits, consumeTotpRateLimit } from "@/server/auth/rate-limit.service";

describe("admin TOTP foundation", () => {
  beforeEach(() => resetRateLimits());

  it("generates an RFC 6238-compatible secret, URI and six-digit token", async () => {
    const secret = createTotpSecret();
    const uri = createTotpUri(secret, "admin@toolyo.dev", "Toolyo");
    const token = await generate({ secret });
    expect(secret.length).toBeGreaterThanOrEqual(26);
    expect(uri).toContain("otpauth://totp/");
    expect(token).toMatch(/^\d{6}$/);
    await expect(verifyTotpCode(secret, token)).resolves.toBe(true);
  });

  it("encrypts and decrypts the stored secret without plaintext persistence", () => {
    const secret = createTotpSecret();
    const encrypted = encryptTotpSecret(secret);
    expect(encrypted).not.toContain(secret);
    expect(decryptTotpSecret(encrypted)).toBe(secret);
  });

  it("blocks after five verification attempts in a one-minute window", () => {
    const attempts = Array.from({ length: 6 }, () => consumeTotpRateLimit("user-1", 1_000));
    expect(attempts.slice(0, 5).every((item) => item.allowed)).toBe(true);
    expect(attempts[5]?.allowed).toBe(false);
  });
});