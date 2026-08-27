import type { OtpChannel, OtpPurpose, PrismaClient } from "@prisma/client";
import { createOtpChallenge } from "./otp.service";
import { consumeRateLimit } from "./rate-limit.service";
import { env } from "@/env.mjs";
import { consoleEmailProvider } from "../integrations/email/email.provider";
import { consoleSmsProvider } from "../integrations/sms/sms.provider";
import { ValidationError } from "../lib/errors/domain-errors";
import { normalizeEmail, normalizePhone } from "./normalization";

const OTP_SECRET = process.env.OTP_SECRET ?? "development-only-otp-secret";

export async function requestOtp(prisma: PrismaClient, input: { userId?: string; channel: OtpChannel; purpose: OtpPurpose; destination: string; ip?: string }) {
  if (input.channel === "phone" && !env.SMS_OTP_ENABLED) {
    throw new ValidationError("La verificación OTP por SMS no está habilitada en este entorno");
  }
  const destination = input.channel === "email" ? normalizeEmail(input.destination) : normalizePhone(input.destination);
  const key = `${input.channel}:${destination ?? "invalid"}:${input.ip ?? "unknown"}`;
  const limited = consumeRateLimit(key, 3, 10 * 60 * 1000);
  if (!limited.allowed) return { challengeId: "", expiresAt: new Date(Date.now() + limited.retryAfterSeconds * 1000), retryAfterSeconds: limited.retryAfterSeconds };
  const created = await createOtpChallenge(prisma, input, OTP_SECRET);
  if (input.channel === "email") await consoleEmailProvider.sendVerificationCode({ to: created.destination, code: created.code, expiresAt: created.expiresAt });
  else await consoleSmsProvider.sendVerificationCode({ toE164: normalizePhone(created.destination) ?? created.destination, code: created.code, expiresAt: created.expiresAt });
  return { challengeId: created.challenge.id, expiresAt: created.expiresAt, retryAfterSeconds: 0 };
}
