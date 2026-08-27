import { createHmac, randomInt } from "node:crypto";
import type { PrismaClient, OtpChannel, OtpPurpose } from "@prisma/client";
import { normalizeEmail, normalizePhone } from "./normalization";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function digest(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function generateOtp(secret: string): { code: string; codeHash: string; expiresAt: Date } {
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  return { code, codeHash: digest(code, secret), expiresAt: new Date(Date.now() + OTP_TTL_MS) };
}

export async function createOtpChallenge(
  prisma: PrismaClient,
  input: { userId?: string; channel: OtpChannel; purpose: OtpPurpose; destination: string },
  secret: string,
) {
  const destination = input.channel === "email" ? normalizeEmail(input.destination) : normalizePhone(input.destination);
  if (!destination) throw new Error("Invalid verification destination");
  const otp = generateOtp(secret);
  const destinationHash = digest(destination, secret);
  await prisma.otpChallenge.updateMany({
    where: { userId: input.userId, channel: input.channel, purpose: input.purpose, consumedAt: null, blockedAt: null },
    data: { blockedAt: new Date() },
  });
  const challenge = await prisma.otpChallenge.create({
    data: { userId: input.userId, channel: input.channel, purpose: input.purpose, destinationHash, codeHash: otp.codeHash, expiresAt: otp.expiresAt },
  });
  return { challenge, code: otp.code, destination, expiresAt: otp.expiresAt };
}

export async function consumeOtpChallenge(prisma: PrismaClient, challengeId: string, code: string, secret: string) {
  return prisma.$transaction(async (tx) => {
    const challenge = await tx.otpChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge || challenge.consumedAt || challenge.blockedAt || challenge.expiresAt <= new Date()) {
      return { ok: false as const, reason: "challenge_expired" as const, attemptsRemaining: 0 };
    }
    const valid = digest(code, secret) === challenge.codeHash;
    if (!valid) {
      const attemptCount = challenge.attemptCount + 1;
      const blocked = attemptCount >= MAX_ATTEMPTS;
      await tx.otpChallenge.update({ where: { id: challenge.id }, data: { attemptCount, blockedAt: blocked ? new Date() : null } });
      return { ok: false as const, reason: blocked ? "challenge_blocked" as const : "challenge_invalid" as const, attemptsRemaining: Math.max(0, MAX_ATTEMPTS - attemptCount) };
    }
    await tx.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
    if (challenge.userId) {
      await tx.verificationState.update({
        where: { userId_channel: { userId: challenge.userId, channel: challenge.channel === "email" ? "email" : "phone" } },
        data: { status: "verified", verifiedAt: new Date() },
      });
    }
    return { ok: true as const, channel: challenge.channel, attemptsRemaining: MAX_ATTEMPTS };
  });
}
