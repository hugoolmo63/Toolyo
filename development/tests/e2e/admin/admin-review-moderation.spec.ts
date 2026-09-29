import { expect, test } from "@playwright/test";

test("admin reviews panel is reachable for a seeded admin", async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_COOKIE, "Requires E2E_ADMIN_COOKIE for a seeded admin session");
  await page.context().addCookies([{ name: "toolyo_session", value: process.env.E2E_ADMIN_COOKIE!, url: "http://127.0.0.1:3000" }]);
  await page.goto("/admin/reviews");
  await expect(page.getByRole("heading", { name: "Moderación de Reviews" })).toBeVisible();
});