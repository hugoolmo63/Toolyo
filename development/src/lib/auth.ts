import { createSessionToken, sessionCookieOptions } from "@/server/auth/session.service";

export { createSessionToken, sessionCookieOptions };

export function publicSessionClaims(input: { userId: string; email: string; role: "user" | "admin" }) {
  return { sub: input.userId, email: input.email, role: input.role } as const;
}
