import { expect, test } from "@playwright/test";

test.describe("Backoffice 2FA access", () => {
  test("redirects an authenticated admin without 2FA to setup and renders the QR flow", async ({ page }) => {
    test.skip(!process.env.E2E_ADMIN_COOKIE, "Requires E2E_ADMIN_COOKIE for a seeded admin session");
    await page.context().addCookies([{ name: "toolyo_session", value: process.env.E2E_ADMIN_COOKIE!, url: "http://127.0.0.1:3000" }]);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/setup-2fa/);
    await expect(page.getByRole("heading", { name: "Configurar 2FA" })).toBeVisible();
    await page.getByRole("button", { name: "Generar QR" }).click();
    await expect(page.locator("img[alt*='Código QR']")).toBeVisible();
  });

  test("renders the second-factor form when the login response is pending 2FA", async ({ page }) => {
    await page.goto("/auth?tab=login&twoFactor=required");
    await expect(page.getByRole("heading", { name: "Confirma tu acceso." })).toBeVisible();
    await expect(page.getByLabel("Código de autenticación")).toBeVisible();
  });
});