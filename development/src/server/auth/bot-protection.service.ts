import { env } from "@/env.mjs";
import { ValidationError } from "@/server/lib/errors/domain-errors";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyBotProtection(token: string | undefined, remoteIp?: string | null) {
  if (!env.TURNSTILE_SECRET_KEY) {
    if (env.NODE_ENV !== "production" && token === "development-human-check") return;
    throw new ValidationError("Completa la verificación «No soy un robot».");
  }
  if (!token || token.length > 2048) throw new ValidationError("Completa la verificación «No soy un robot».");

  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);
  const response = await fetch(TURNSTILE_VERIFY_URL, { method: "POST", body, cache: "no-store" });
  if (!response.ok) throw new ValidationError("No se pudo validar la verificación. Inténtalo de nuevo.");
  const result = await response.json() as { success?: boolean };
  if (!result.success) throw new ValidationError("La verificación no es válida. Inténtalo de nuevo.");
}