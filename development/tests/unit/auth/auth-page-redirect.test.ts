import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Guard de sesión en /auth (007-login-contextual, US4).
 * Usuario ya identificado → redirect a callback validado o /dashboard.
 */

const getSession = vi.fn();
const getRegistrationLegalDocuments = vi.fn();

vi.mock("@/lib/server-api", () => ({
  createServerApi: vi.fn(async () => ({
    auth: { getSession, getRegistrationLegalDocuments },
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/env.mjs", () => ({
  env: { SESSION_COOKIE_NAME: "toolyo_session" },
}));

import AuthPage from "@/app/(auth)/auth/page";

const sessionStub = {
  accountStatus: "active",
  email: "verified",
  phone: "pending",
  identity: "not_started",
  capabilities: {},
};

describe("AuthPage — redirect si ya autenticado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRegistrationLegalDocuments.mockResolvedValue([]);
  });

  it("sin sesión renderiza el contenido de auth", async () => {
    getSession.mockResolvedValue(null);
    const result = await AuthPage({ searchParams: {} });
    expect(result).toBeTruthy();
    expect(getRegistrationLegalDocuments).toHaveBeenCalledOnce();
  });

  it("con sesión redirige a /dashboard por defecto", async () => {
    getSession.mockResolvedValue(sessionStub);
    await expect(AuthPage({ searchParams: {} })).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(getRegistrationLegalDocuments).not.toHaveBeenCalled();
  });

  it("con sesión redirige al callback interno validado", async () => {
    getSession.mockResolvedValue(sessionStub);
    await expect(
      AuthPage({ searchParams: { callback: "/dashboard/products" } }),
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard/products");
  });

  it("con sesión ignora callbacks externos o malformados", async () => {
    getSession.mockResolvedValue(sessionStub);
    await expect(
      AuthPage({ searchParams: { callback: "//evil.com" } }),
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard");
  });
});
