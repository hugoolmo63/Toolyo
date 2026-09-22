import { test, expect } from "@playwright/test";

test("product panel route remains available to the authentication flow", async ({ page }) => {
  await page.goto("/dashboard/products");
  await expect(page).toHaveURL(/\/auth\?tab=login/);
});
