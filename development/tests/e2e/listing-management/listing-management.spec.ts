import { test, expect } from "@playwright/test";

test.describe("listing management", () => {
  test("redirects an anonymous visitor from the product panel", async ({ page }) => {
    await page.goto("/dashboard/products");
    await expect(page).toHaveURL(/\/auth\?tab=login/);
  });
});
