import { expect, test } from "@playwright/test";

test("admin users and KYC panel is reachable with an authenticated admin", async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_COOKIE, "Requires E2E_ADMIN_COOKIE for a seeded admin session");
  await page.context().addCookies([{ name: "toolyo_session", value: process.env.E2E_ADMIN_COOKIE!, url: "http://127.0.0.1:3000" }]);
  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "Usuarios y KYC" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Usuarios administrativos" })).toBeVisible();
});