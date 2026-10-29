import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const envMock = vi.hoisted(() => ({
  TURNSTILE_SECRET_KEY: undefined as string | undefined,
  NODE_ENV: "test" as string,
}));

vi.mock("@/env.mjs", () => ({ env: envMock }));

import { verifyBotProtection } from "@/server/auth/bot-protection.service";

const fetchMock = vi.fn();

describe("verifyBotProtection", () => {
  beforeEach(() => {
    envMock.TURNSTILE_SECRET_KEY = undefined;
    envMock.NODE_ENV = "test";
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("sin TURNSTILE_SECRET_KEY configurada", () => {
    it("acepta el token de desarrollo fuera de producción", async () => {
      await expect(verifyBotProtection("development-human-check")).resolves.toBeUndefined();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("rechaza cualquier otro token", async () => {
      await expect(verifyBotProtection("forged-token")).rejects.toMatchObject({ code: "validation_error", statusCode: 400 });
      await expect(verifyBotProtection(undefined)).rejects.toMatchObject({ code: "validation_error" });
    });

    it("rechaza incluso el token de desarrollo en producción (fail-secure)", async () => {
      envMock.NODE_ENV = "production";
      await expect(verifyBotProtection("development-human-check")).rejects.toMatchObject({ code: "validation_error" });
    });
  });

  describe("con TURNSTILE_SECRET_KEY configurada", () => {
    beforeEach(() => {
      envMock.TURNSTILE_SECRET_KEY = "test-secret";
    });

    it("rechaza cuando no hay token o es demasiado largo sin llamar a siteverify", async () => {
      await expect(verifyBotProtection(undefined)).rejects.toMatchObject({ code: "validation_error" });
      await expect(verifyBotProtection("x".repeat(2049))).rejects.toMatchObject({ code: "validation_error" });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("verifica el token contra siteverify con la IP remota", async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });

      await expect(verifyBotProtection("valid-token", "203.0.113.10")).resolves.toBeUndefined();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("challenges.cloudflare.com/turnstile");
      const body = init.body as URLSearchParams;
      expect(body.get("secret")).toBe("test-secret");
      expect(body.get("response")).toBe("valid-token");
      expect(body.get("remoteip")).toBe("203.0.113.10");
    });

    it("no envía remoteip cuando no hay IP del cliente", async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });

      await verifyBotProtection("valid-token");

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect((init.body as URLSearchParams).get("remoteip")).toBeNull();
    });

    it("rechaza cuando siteverify devuelve success=false", async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: false }) });
      await expect(verifyBotProtection("bad-token")).rejects.toMatchObject({ code: "validation_error" });
    });

    it("rechaza cuando siteverify responde con error HTTP", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 502 });
      await expect(verifyBotProtection("any-token")).rejects.toMatchObject({ code: "validation_error" });
    });
  });
});
