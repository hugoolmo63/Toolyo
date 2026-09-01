import { env } from "@/env.mjs";
import type { SessionCookieOptions } from "@/server/auth/session.service";

/**
 * Serializes a cookie header value for Set-Cookie.
 * Uses the session cookie options from session.service.ts.
 */
export function serializeSessionCookie(token: string, ttlSeconds: number, isProduction = process.env.NODE_ENV === "production"): string {
  const opts: SessionCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: ttlSeconds,
  };
  const parts = [
    `${env.SESSION_COOKIE_NAME}=${token}`,
    `Path=${opts.path}`,
    `Max-Age=${opts.maxAge}`,
    `SameSite=${opts.sameSite}`,
  ];
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}

export function serializeClearSessionCookie(isProduction = process.env.NODE_ENV === "production"): string {
  const parts = [
    `${env.SESSION_COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "SameSite=lax",
  ];
  if (isProduction) parts.push("Secure");
  parts.push("HttpOnly");
  return parts.join("; ");
}

/**
 * Reads the session token from a cookie header value.
 * Returns null if the cookie is not present.
 */
export function readSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split("=");
    if (name === env.SESSION_COOKIE_NAME) {
      return valueParts.join("=") || null;
    }
  }
  return null;
}

/**
 * Validates that a callback path is a safe internal route.
 * Rejects protocol-relative URLs, path traversal, and external URLs.
 */
export function validateCallbackPath(callback: string | undefined, defaultPath = "/dashboard"): string {
  if (!callback) return defaultPath;
  if (!callback.startsWith("/") || callback.startsWith("//")) return defaultPath;
  if (callback.includes("\\") || callback.includes("\0")) return defaultPath;
  if (callback.length > 512) return defaultPath;
  return callback;
}
