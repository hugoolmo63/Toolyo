import { describe, expect, it } from "vitest";
import { consoleEmailProvider } from "@/server/integrations/email/email.provider";
import { consoleSmsProvider } from "@/server/integrations/sms/sms.provider";
import { consumeRateLimit, resetRateLimits } from "@/server/auth/rate-limit.service";

describe("provider adapters and limits", () => {
  it("never returns the OTP from console adapters", async () => {
    const email = await consoleEmailProvider.sendVerificationCode({ to: "person@example.com", code: "123456", expiresAt: new Date() });
    const sms = await consoleSmsProvider.sendVerificationCode({ toE164: "+34600123456", code: "123456", expiresAt: new Date() });
    expect(email.providerMessageId).not.toContain("123456");
    expect(sms.providerMessageId).not.toContain("123456");
  });

  it("blocks a bucket after its configured limit", () => {
    resetRateLimits();
    expect(consumeRateLimit("test", 2, 1000, 100).allowed).toBe(true);
    expect(consumeRateLimit("test", 2, 1000, 101).allowed).toBe(true);
    expect(consumeRateLimit("test", 2, 1000, 102).allowed).toBe(false);
  });
});
