import type { PrismaClient } from "@prisma/client";
import { AppError, UnauthorizedError } from "../lib/errors/domain-errors";
import { normalizeEmail } from "./normalization";
import { verifyPassword } from "./password";
import { consumeRateLimit } from "./rate-limit.service";
import { createSession } from "./session.service";
import { recordSecurityEvent } from "../services/security-event.service";
import type { LoginResult } from "@/types/auth";
import { createPending2faChallenge } from "./admin-2fa-challenge.service";

const LOGIN_RATE_LIMIT = 5;
const LOGIN_RATE_WINDOW_MS = 60 * 1000;

export class RateLimitedError extends AppError {
  readonly retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super(`Demasiados intentos. Inténtalo de nuevo en ${retryAfterSeconds} segundos.`, "rate_limited", 429);
    this.name = "RateLimitedError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class AccountSuspendedError extends AppError {
  constructor() {
    super("Esta cuenta está suspendida. Contacta con soporte para más información.", "account_suspended", 403);
    this.name = "AccountSuspendedError";
  }
}

export async function loginWithPassword(
  prisma: PrismaClient,
  input: { email: string; password: string; rememberMe?: boolean; ip?: string; userAgent?: string; requestId?: string },
): Promise<{ result: LoginResult; sessionToken: string; ttlSeconds: number }> {
  const emailNormalized = normalizeEmail(input.email);

  // Rate limit dual bucket: IP + email (SECURITY.md §5.2)
  const ipKey = `login:ip:${input.ip ?? "unknown"}`;
  const emailKey = `login:email:${emailNormalized}`;
  const ipLimit = consumeRateLimit(ipKey, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS);
  const emailLimit = consumeRateLimit(emailKey, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS);

  if (!ipLimit.allowed || !emailLimit.allowed) {
    const retryAfterSeconds = Math.max(
      ipLimit.allowed ? 0 : ipLimit.retryAfterSeconds,
      emailLimit.allowed ? 0 : emailLimit.retryAfterSeconds,
    );
    await recordSecurityEvent(prisma, {
      eventType: "login_blocked",
      outcome: "blocked",
      metadata: { ip: input.ip ?? "unknown", retryAfterSeconds },
    });
    throw new RateLimitedError(retryAfterSeconds);
  }

  // Lookup user by normalized email
  const user = await prisma.user.findUnique({
    where: { emailNormalized },
    include: {
      passwordCredential: true,
      verificationStates: true,
      totpCredential: true,
    },
  });

  // Generic error for both "user not found" and "wrong password" — no enumeration
  const invalidCredentials = () => new UnauthorizedError("Email o contraseña no válidos.");

  if (!user || !user.passwordCredential) {
    await recordSecurityEvent(prisma, {
      eventType: "login_failure",
      outcome: "failure",
      metadata: { ip: input.ip ?? "unknown" },
    });
    throw invalidCredentials();
  }

  // Check account status before password verification
  if (user.accountStatus === "suspended") {
    await recordSecurityEvent(prisma, {
      eventType: "login_failure",
      outcome: "failure",
      userId: user.id,
      metadata: { ip: input.ip ?? "unknown", reason: "suspended" },
    });
    throw new AccountSuspendedError();
  }

  if (user.accountStatus === "deleted" || user.accountStatus === "deletion_requested") {
    // Generic message — don't reveal the account was deleted
    await recordSecurityEvent(prisma, {
      eventType: "login_failure",
      outcome: "failure",
      userId: user.id,
      metadata: { ip: input.ip ?? "unknown", reason: "deleted" },
    });
    throw invalidCredentials();
  }

  // Verify password with timing-safe comparison
  const passwordValid = await verifyPassword(input.password, user.passwordCredential.passwordHash);
  if (!passwordValid) {
    await recordSecurityEvent(prisma, {
      eventType: "login_failure",
      outcome: "failure",
      userId: user.id,
      metadata: { ip: input.ip ?? "unknown" },
    });
    throw invalidCredentials();
  }

  const emailVerificationStatus =
    user.verificationStates.find((s) => s.channel === "email")?.status ?? "pending";

  if ((user.role === "ADMIN" || user.role === "MODERATOR") && user.totpCredential?.isEnabled) {
    const challenge = createPending2faChallenge({ userId: user.id, rememberMe: input.rememberMe, ip: input.ip, userAgent: input.userAgent });
    await recordSecurityEvent(prisma, { eventType: "login_pending_2fa", outcome: "success", userId: user.id, requestId: input.requestId, metadata: { ip: input.ip ?? "unknown" } });
    return {
      result: { userId: user.id, accountStatus: user.accountStatus, emailVerificationStatus: emailVerificationStatus as "pending" | "verified" | "blocked", redirectTo: "/auth?tab=login&twoFactor=required", sessionState: "PENDING_2FA", challengeId: challenge.challengeId, role: user.role },
      sessionToken: "",
      ttlSeconds: 0,
    };
  }

  // Login successful — create session
  const session = await createSession(prisma, {
    userId: user.id,
    rememberMe: input.rememberMe,
    ip: input.ip,
    userAgent: input.userAgent,
  });

  await recordSecurityEvent(prisma, {
    eventType: "login_success",
    outcome: "success",
    userId: user.id,
    requestId: input.requestId,
    metadata: { ip: input.ip ?? "unknown" },
  });

  // Determine redirect: verify if email not verified, else dashboard
  const redirectTo = emailVerificationStatus === "verified" ? "/dashboard" : "/verify";

  return {
    result: {
      userId: user.id,
      accountStatus: user.accountStatus,
      emailVerificationStatus: emailVerificationStatus as "pending" | "verified" | "blocked",
      redirectTo,
    },
    sessionToken: session.token,
    ttlSeconds: session.ttlSeconds,
  };
}

export function validateCallbackPath(callback: string | undefined, defaultPath = "/dashboard"): string {
  if (!callback) return defaultPath;
  // Must start with "/" and not "//" (protocol-relative URL)
  if (!callback.startsWith("/") || callback.startsWith("//")) return defaultPath;
  // Reject path traversal and backslashes
  if (callback.includes("\\") || callback.includes("\0")) return defaultPath;
  // Must be a reasonable length
  if (callback.length > 512) return defaultPath;
  return callback;
}
