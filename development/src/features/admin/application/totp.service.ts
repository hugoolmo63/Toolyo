import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { env } from "@/env.mjs";
import { consumeTotpRateLimit } from "@/server/auth/rate-limit.service";
import { AuditWriteFailedError, TotpInvalidError, TotpLockedError } from "../domain/admin-errors";
import { createTotpQr } from "../infrastructure/totp-qr.service";
import { createTotpSecret, createTotpUri, verifyTotpCode } from "../infrastructure/totp.provider";

const algorithm = "aes-256-gcm";
const setupChallenges = new Map<string, { userId: string; secret: string; expiresAt: number }>();

export function getPendingTotpSecretForTests(setupId: string): string | null {
  return process.env.NODE_ENV === "test" ? setupChallenges.get(setupId)?.secret ?? null : null;
}

function encryptionKey(): Buffer {
  const value = env.TOTP_ENCRYPTION_KEY ?? (process.env.NODE_ENV === "test" ? "test-totp-encryption-key-32-chars" : undefined);
  if (!value) throw new Error("TOTP_ENCRYPTION_KEY is required for TOTP persistence");
  return Buffer.from(value.padEnd(32, "0").slice(0, 32));
}

export function encryptTotpSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptTotpSecret(payload: string): string {
  const [ivEncoded, tagEncoded, encryptedEncoded] = payload.split(".");
  if (!ivEncoded || !tagEncoded || !encryptedEncoded) throw new Error("Invalid encrypted TOTP secret");
  const decipher = createDecipheriv(algorithm, encryptionKey(), Buffer.from(ivEncoded, "base64url"));
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedEncoded, "base64url")), decipher.final()]).toString("utf8");
}

export async function startTotpSetup(prisma: PrismaClient, userId: string) {
  const secret = createTotpSecret();
  const setupId = randomBytes(18).toString("base64url");
  const expiresAt = Date.now() + 10 * 60_000;
  setupChallenges.set(setupId, { userId, secret, expiresAt });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { emailNormalized: true } });
  const qrDataUrl = await createTotpQr(createTotpUri(secret, user.emailNormalized, env.TOTP_ISSUER));
  return { setupId, qrDataUrl, expiresAt: new Date(expiresAt).toISOString() };
}

export async function confirmTotpSetup(prisma: PrismaClient, userId: string, setupId: string, code: string) {
  const challenge = setupChallenges.get(setupId);
  if (!challenge || challenge.userId !== userId || challenge.expiresAt <= Date.now() || !(await verifyTotpCode(challenge.secret, code))) throw new TotpInvalidError();
  setupChallenges.delete(setupId);
  await prisma.totpCredential.upsert({
    where: { userId },
    update: { secretCiphertext: encryptTotpSecret(challenge.secret), keyVersion: "v1", isEnabled: true, enabledAt: new Date(), failedAttempts: 0, lockedUntil: null },
    create: { userId, secretCiphertext: encryptTotpSecret(challenge.secret), keyVersion: "v1", isEnabled: true, enabledAt: new Date() },
  });
  return { enabled: true as const, enabledAt: new Date().toISOString() };
}

export async function verifyStoredTotp(prisma: PrismaClient, userId: string, code: string) {
  const limit = consumeTotpRateLimit(userId);
  if (!limit.allowed) throw new TotpLockedError();
  const credential = await prisma.totpCredential.findUnique({ where: { userId } });
  if (!credential?.isEnabled || (credential.lockedUntil && credential.lockedUntil > new Date())) throw new TotpLockedError();
  const valid = await verifyTotpCode(decryptTotpSecret(credential.secretCiphertext), code);
  if (!valid) {
    await prisma.totpCredential.update({ where: { userId }, data: { failedAttempts: { increment: 1 } } });
    throw new TotpInvalidError();
  }
  await prisma.totpCredential.update({ where: { userId }, data: { failedAttempts: 0, lastUsedAt: new Date() } });
  return true;
}

export function assertAuditWrite(_error: unknown): never {
  throw new AuditWriteFailedError();
}