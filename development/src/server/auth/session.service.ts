import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { env } from "@/env.mjs";
import type { SessionClaims } from "@/types/auth";
import { deriveCapabilities } from "./capabilities.service";

export interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sessionCookieOptions(ttlSeconds: number, isProduction = process.env.NODE_ENV === "production"): SessionCookieOptions {
  return { httpOnly: true, secure: isProduction, sameSite: "lax", path: "/", maxAge: ttlSeconds };
}

export function clearSessionCookieOptions(isProduction = process.env.NODE_ENV === "production"): SessionCookieOptions {
  return { httpOnly: true, secure: isProduction, sameSite: "lax", path: "/", maxAge: 0 };
}

export async function createSession(
  prisma: PrismaClient,
  input: { userId: string; rememberMe?: boolean; ip?: string; userAgent?: string },
): Promise<{ token: string; expiresAt: Date; ttlSeconds: number }> {
  const ttlSeconds = input.rememberMe ? env.SESSION_REMEMBER_TTL_SECONDS : env.SESSION_TTL_SECONDS;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const token = createSessionToken();
  await prisma.session.create({
    data: { token, userId: input.userId, expiresAt, ip: input.ip, userAgent: input.userAgent },
  });
  return { token, expiresAt, ttlSeconds };
}

export async function validateSession(prisma: PrismaClient, token: string): Promise<SessionClaims | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          verificationStates: true,
        },
      },
    },
  });
  if (!session) return null;
  if (session.revokedAt !== null) return null;
  if (session.expiresAt <= new Date()) return null;

  const emailState = session.user.verificationStates.find((s) => s.channel === "email")?.status ?? "pending";
  const phoneState = session.user.verificationStates.find((s) => s.channel === "phone")?.status ?? "pending";
  const capabilities = deriveCapabilities({
    accountStatus: session.user.accountStatus,
    email: emailState as "pending" | "verified" | "blocked",
    phone: phoneState as "pending" | "verified" | "blocked",
    identity: "not_started",
  });

  return {
    userId: session.user.id,
    email: session.user.emailNormalized,
    accountStatus: session.user.accountStatus,
    emailVerificationStatus: emailState as "pending" | "verified" | "blocked",
    capabilities,
  };
}

export async function revokeSession(prisma: PrismaClient, token: string): Promise<void> {
  await prisma.session.updateMany({
    where: { token, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserSessions(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
