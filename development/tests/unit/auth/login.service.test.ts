import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/env.mjs", () => ({
  env: {
    SESSION_COOKIE_NAME: "toolyo_session",
    SESSION_TTL_SECONDS: 3600,
    SESSION_REMEMBER_TTL_SECONDS: 2592000,
  },
}));

import type { PrismaClient } from "@prisma/client";
import { loginWithPassword, validateCallbackPath } from "@/server/auth/login.service";
import { resetRateLimits } from "@/server/auth/rate-limit.service";
import { hashPassword } from "@/server/auth/password";

function createMockPrisma(overrides?: Record<string, unknown>): PrismaClient {
  return {
    user: { findUnique: vi.fn().mockResolvedValue(null) },
    session: { create: vi.fn().mockResolvedValue({}) },
    securityEvent: { create: vi.fn().mockResolvedValue({}) },
    ...overrides,
  } as unknown as PrismaClient;
}

const VALID_PASSWORD = "ValidPassword123!";
const VALID_HASH = await hashPassword(VALID_PASSWORD);

beforeEach(() => {
  resetRateLimits();
});

describe("loginWithPassword", () => {
  it("returns login result and session token for valid credentials with active account", async () => {
    const prisma = createMockPrisma({
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-1",
          emailNormalized: "test@toolyo.dev",
          accountStatus: "active",
          passwordCredential: { passwordHash: VALID_HASH },
          verificationStates: [{ channel: "email", status: "verified" }],
        }),
      },
    });

    const result = await loginWithPassword(prisma, {
      email: "Test@Toolyo.Dev",
      password: VALID_PASSWORD,
    });

    expect(result.result.userId).toBe("user-1");
    expect(result.result.accountStatus).toBe("active");
    expect(result.result.emailVerificationStatus).toBe("verified");
    expect(result.result.redirectTo).toBe("/dashboard");
    expect(result.sessionToken).toBeDefined();
    expect(result.ttlSeconds).toBe(3600);
  });

  it("redirects to /verify when email is not verified", async () => {
    const prisma = createMockPrisma({
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-2",
          emailNormalized: "pending@toolyo.dev",
          accountStatus: "pending",
          passwordCredential: { passwordHash: VALID_HASH },
          verificationStates: [{ channel: "email", status: "pending" }],
        }),
      },
    });

    const result = await loginWithPassword(prisma, {
      email: "pending@toolyo.dev",
      password: VALID_PASSWORD,
    });

    expect(result.result.redirectTo).toBe("/verify");
  });

  it("throws UnauthorizedError for non-existent email (same generic message as wrong password)", async () => {
    const prisma = createMockPrisma();

    await expect(
      loginWithPassword(prisma, {
        email: "nonexistent@toolyo.dev",
        password: VALID_PASSWORD,
      }),
    ).rejects.toThrow("Email o contraseña no válidos.");
  });

  it("throws UnauthorizedError for wrong password (same generic message)", async () => {
    const prisma = createMockPrisma({
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-1",
          emailNormalized: "test@toolyo.dev",
          accountStatus: "active",
          passwordCredential: { passwordHash: VALID_HASH },
          verificationStates: [],
        }),
      },
    });

    await expect(
      loginWithPassword(prisma, {
        email: "test@toolyo.dev",
        password: "WrongPassword123!",
      }),
    ).rejects.toThrow("Email o contraseña no válidos.");
  });

  it("throws AccountSuspendedError for suspended accounts", async () => {
    const prisma = createMockPrisma({
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-3",
          emailNormalized: "suspended@toolyo.dev",
          accountStatus: "suspended",
          passwordCredential: { passwordHash: VALID_HASH },
          verificationStates: [],
        }),
      },
    });

    await expect(
      loginWithPassword(prisma, {
        email: "suspended@toolyo.dev",
        password: VALID_PASSWORD,
      }),
    ).rejects.toThrow("Esta cuenta está suspendida.");
  });

  it("throws generic UnauthorizedError for deleted accounts (no enumeration)", async () => {
    const prisma = createMockPrisma({
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-4",
          emailNormalized: "deleted@toolyo.dev",
          accountStatus: "deleted",
          passwordCredential: { passwordHash: VALID_HASH },
          verificationStates: [],
        }),
      },
    });

    await expect(
      loginWithPassword(prisma, {
        email: "deleted@toolyo.dev",
        password: VALID_PASSWORD,
      }),
    ).rejects.toThrow("Email o contraseña no válidos.");
  });

  it("uses extended TTL when rememberMe is true", async () => {
    const prisma = createMockPrisma({
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-1",
          emailNormalized: "test@toolyo.dev",
          accountStatus: "active",
          passwordCredential: { passwordHash: VALID_HASH },
          verificationStates: [{ channel: "email", status: "verified" }],
        }),
      },
    });

    const result = await loginWithPassword(prisma, {
      email: "test@toolyo.dev",
      password: VALID_PASSWORD,
      rememberMe: true,
    });

    expect(result.ttlSeconds).toBe(2592000);
  });

  it("throws RateLimitedError after 5 failed attempts from same IP", async () => {
    const prisma = createMockPrisma();

    for (let i = 0; i < 5; i++) {
      await expect(
        loginWithPassword(prisma, {
          email: `user${i}@toolyo.dev`,
          password: VALID_PASSWORD,
          ip: "192.168.1.1",
        }),
      ).rejects.toThrow("Email o contraseña no válidos.");
    }

    await expect(
      loginWithPassword(prisma, {
        email: "user6@toolyo.dev",
        password: VALID_PASSWORD,
        ip: "192.168.1.1",
      }),
    ).rejects.toThrow("Demasiados intentos.");
  });

  it("records security events for success and failure", async () => {
    const prisma = createMockPrisma({
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-1",
          emailNormalized: "test@toolyo.dev",
          accountStatus: "active",
          passwordCredential: { passwordHash: VALID_HASH },
          verificationStates: [{ channel: "email", status: "verified" }],
        }),
      },
    });

    await loginWithPassword(prisma, {
      email: "test@toolyo.dev",
      password: VALID_PASSWORD,
    });

    // Should have recorded a login_success event
    const createCalls = (prisma.securityEvent.create as ReturnType<typeof vi.fn>).mock.calls;
    const successCall = createCalls.find((call: unknown[]) => (call[0] as { data: { eventType: string } }).data.eventType === "login_success");
    expect(successCall).toBeDefined();
  });
});

describe("validateCallbackPath", () => {
  it("returns default path for undefined callback", () => {
    expect(validateCallbackPath(undefined)).toBe("/dashboard");
  });

  it("returns the callback for valid internal paths", () => {
    expect(validateCallbackPath("/profile")).toBe("/profile");
    expect(validateCallbackPath("/dashboard?tab=1")).toBe("/dashboard?tab=1");
  });

  it("rejects protocol-relative URLs", () => {
    expect(validateCallbackPath("//evil.com")).toBe("/dashboard");
  });

  it("rejects external URLs", () => {
    expect(validateCallbackPath("https://evil.com")).toBe("/dashboard");
  });

  it("rejects path traversal", () => {
    expect(validateCallbackPath("/\\..\\..")).toBe("/dashboard");
  });

  it("rejects excessively long paths", () => {
    expect(validateCallbackPath("/" + "a".repeat(600))).toBe("/dashboard");
  });
});
