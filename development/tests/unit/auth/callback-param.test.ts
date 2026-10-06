import { describe, it, expect, vi } from "vitest";

vi.mock("@/env.mjs", () => ({
  env: {
    SESSION_COOKIE_NAME: "toolyo_session",
    SESSION_TTL_SECONDS: 3600,
    SESSION_REMEMBER_TTL_SECONDS: 2592000,
  },
}));

import { validateCallbackPath } from "@/lib/auth";
import { isPrivatePathname } from "@/lib/private-paths";
import { LoginSchema } from "@/lib/validations/auth";

/**
 * Unificación del parámetro de retorno (007-login-contextual, FR-011).
 * `callback` es el único nombre válido; `callbackUrl` quedó eliminado.
 */
describe("callback param — LoginSchema", () => {
  const base = { email: "user@example.com", password: "a".repeat(12) };

  it("accepts short passwords and uses a generic message for invalid credentials", () => {
    expect(LoginSchema.safeParse({ email: "user@example.com", password: "short" }).success).toBe(true);

    for (const credentials of [
      { email: "invalid-email", password: "secret" },
      { email: "user@example.com", password: "" },
      { email: "", password: "secret" },
    ]) {
      const result = LoginSchema.safeParse(credentials);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.every((issue) => issue.message === "Correo o contraseña incorrectos")).toBe(true);
      }
    }
  });

  it("acepta callback como ruta interna", () => {
    const parsed = LoginSchema.parse({ ...base, callback: "/dashboard/products" });
    expect(parsed.callback).toBe("/dashboard/products");
  });

  it("callback es opcional", () => {
    const parsed = LoginSchema.parse(base);
    expect(parsed.callback).toBeUndefined();
  });

  it("rechaza callback que no empieza por /", () => {
    const result = LoginSchema.safeParse({ ...base, callback: "https://evil.com" });
    expect(result.success).toBe(false);
  });

  it("rechaza callback de más de 512 caracteres", () => {
    const result = LoginSchema.safeParse({ ...base, callback: `/${"a".repeat(512)}` });
    expect(result.success).toBe(false);
  });
});

describe("validateCallbackPath — hardening", () => {
  it("rechaza rutas de más de 512 caracteres", () => {
    expect(validateCallbackPath(`/${"a".repeat(512)}`)).toBe("/dashboard");
  });

  it("acepta rutas internas con query y hash", () => {
    expect(validateCallbackPath("/listings/martillo?start=2026-10-01&end=2026-10-05")).toBe(
      "/listings/martillo?start=2026-10-01&end=2026-10-05",
    );
  });
});

describe("isPrivatePathname (post-logout)", () => {
  it("marca /dashboard y subrutas como privadas", () => {
    expect(isPrivatePathname("/dashboard")).toBe(true);
    expect(isPrivatePathname("/dashboard/products")).toBe(true);
    expect(isPrivatePathname("/dashboard/products/abc/edit")).toBe(true);
  });

  it("marca /profile como privada", () => {
    expect(isPrivatePathname("/profile")).toBe(true);
    expect(isPrivatePathname("/profile/settings")).toBe(true);
  });

  it("marca páginas públicas como no privadas", () => {
    expect(isPrivatePathname("/")).toBe(false);
    expect(isPrivatePathname("/listings/martillo")).toBe(false);
    expect(isPrivatePathname("/search")).toBe(false);
    expect(isPrivatePathname("/auth")).toBe(false);
  });

  it("no confunde prefijos parciales", () => {
    expect(isPrivatePathname("/dashboards")).toBe(false);
    expect(isPrivatePathname("/profiler")).toBe(false);
  });
});
