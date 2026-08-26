import { randomBytes } from "node:crypto";

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

export function sessionCookieOptions(isProduction = process.env.NODE_ENV === "production"): SessionCookieOptions {
  return { httpOnly: true, secure: isProduction, sameSite: "lax", path: "/", maxAge: 60 * 60 };
}
