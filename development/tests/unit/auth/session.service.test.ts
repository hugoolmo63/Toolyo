import { describe, it, expect, vi } from "vitest";

vi.mock("@/env.mjs", () => ({
  env: {
    SESSION_COOKIE_NAME: "toolyo_session",
    SESSION_TTL_SECONDS: 3600,
    SESSION_REMEMBER_TTL_SECONDS: 2592000,
  },
}));

import type { PrismaClient } from "@prisma/client";
import { createSession, validateSession, revokeSession, revokeAllUserSessions, createSessionToken, sessionCookieOptions, clearSessionCookieOptions } from "@/server/auth/session.service";

function createMockPrisma(overrides?: Record<string, unknown>): PrismaClient {
  return {
    session: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue(null),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    ...overrides,
  } as unknown as PrismaClient;
}

describe("session.service", () => {
  describe("createSessionToken", () => {
    it("generates a base64url token of 43 characters (32 bytes)", () => {
      const token = createSessionToken();
      expect(token).toHaveLength(43);
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("generates unique tokens", () => {
      const tokens = new Set(Array.from({ length: 10 }, () => createSessionToken()));
      expect(tokens.size).toBe(10);
    });
  });

  describe("sessionCookieOptions", () => {
    it("returns HttpOnly, SameSite=Lax, Path=/ with given TTL", () => {
      const opts = sessionCookieOptions(3600, false);
      expect(opts.httpOnly).toBe(true);
      expect(opts.secure).toBe(false);
      expect(opts.sameSite).toBe("lax");
      expect(opts.path).toBe("/");
      expect(opts.maxAge).toBe(3600);
    });

    it("sets Secure in production", () => {
      const opts = sessionCookieOptions(3600, true);
      expect(opts.secure).toBe(true);
    });
  });

  describe("clearSessionCookieOptions", () => {
    it("returns Max-Age=0 for cookie deletion", () => {
      const opts = clearSessionCookieOptions(false);
      expect(opts.maxAge).toBe(0);
      expect(opts.httpOnly).toBe(true);
    });
  });

  describe("createSession", () => {
    it("creates a session with token, userId, expiresAt and metadata", async () => {
      const prisma = createMockPrisma();
      const result = await createSession(prisma, {
        userId: "user-1",
        rememberMe: false,
        ip: "127.0.0.1",
        userAgent: "test-agent",
      });

      expect(result.token).toHaveLength(43);
      expect(result.ttlSeconds).toBe(3600);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(prisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            ip: "127.0.0.1",
            userAgent: "test-agent",
          }),
        }),
      );
    });

    it("uses extended TTL when rememberMe is true", async () => {
      const prisma = createMockPrisma();
      const result = await createSession(prisma, {
        userId: "user-1",
        rememberMe: true,
      });

      expect(result.ttlSeconds).toBe(2592000);
    });
  });

  describe("validateSession", () => {
    it("returns null for non-existent token", async () => {
      const prisma = createMockPrisma();
      const result = await validateSession(prisma, "nonexistent");
      expect(result).toBeNull();
    });

    it("returns null for revoked session", async () => {
      const prisma = createMockPrisma({
        session: {
          findUnique: vi.fn().mockResolvedValue({
            id: "s1",
            token: "tok",
            userId: "u1",
            revokedAt: new Date(),
            expiresAt: new Date(Date.now() + 3600_000),
            user: {
              id: "u1",
              emailNormalized: "test@toolyo.dev",
              accountStatus: "active",
              verificationStates: [{ channel: "email", status: "verified" }],
            },
          }),
        },
      });
      const result = await validateSession(prisma, "tok");
      expect(result).toBeNull();
    });

    it("returns null for expired session", async () => {
      const prisma = createMockPrisma({
        session: {
          findUnique: vi.fn().mockResolvedValue({
            id: "s1",
            token: "tok",
            userId: "u1",
            revokedAt: null,
            expiresAt: new Date(Date.now() - 1000),
            user: {
              id: "u1",
              emailNormalized: "test@toolyo.dev",
              accountStatus: "active",
              verificationStates: [],
            },
          }),
        },
      });
      const result = await validateSession(prisma, "tok");
      expect(result).toBeNull();
    });

    it("returns SessionClaims for valid session", async () => {
      const prisma = createMockPrisma({
        session: {
          findUnique: vi.fn().mockResolvedValue({
            id: "s1",
            token: "tok",
            userId: "u1",
            revokedAt: null,
            expiresAt: new Date(Date.now() + 3600_000),
            user: {
              id: "u1",
              emailNormalized: "test@toolyo.dev",
              accountStatus: "active",
              verificationStates: [
                { channel: "email", status: "verified" },
                { channel: "phone", status: "pending" },
              ],
            },
          }),
        },
      });
      const result = await validateSession(prisma, "tok");
      expect(result).not.toBeNull();
      expect(result!.userId).toBe("u1");
      expect(result!.email).toBe("test@toolyo.dev");
      expect(result!.accountStatus).toBe("active");
      expect(result!.emailVerificationStatus).toBe("verified");
      expect(result!.capabilities).toBeDefined();
    });
  });

  describe("revokeSession", () => {
    it("marks session as revoked via updateMany", async () => {
      const prisma = createMockPrisma();
      await revokeSession(prisma, "tok");
      expect(prisma.session.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { token: "tok", revokedAt: null },
          data: { revokedAt: expect.any(Date) },
        }),
      );
    });

    it("is idempotent — only updates sessions that are not already revoked", async () => {
      const prisma = createMockPrisma();
      await revokeSession(prisma, "tok");
      await revokeSession(prisma, "tok");
      expect(prisma.session.updateMany).toHaveBeenCalledTimes(2);
    });
  });

  describe("revokeAllUserSessions", () => {
    it("revokes all active sessions for a user", async () => {
      const prisma = createMockPrisma();
      await revokeAllUserSessions(prisma, "user-1");
      expect(prisma.session.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1", revokedAt: null },
          data: { revokedAt: expect.any(Date) },
        }),
      );
    });
  });
});
