import { test, expect } from "@playwright/test";

async function runAxe(page: Parameters<typeof test>[0] extends never ? never : any) {
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  return page.evaluate(async () => {
    const axe = (window as Window & { axe?: { run: () => Promise<{ violations: Array<{ id: string }> }> } }).axe;
    if (!axe) throw new Error("axe-core no está disponible");
    return axe.run();
  });
}

test.describe("reviews accessibility", () => {
  test.beforeEach(async () => {
    test.skip(!process.env.E2E_REVIEWS_ENABLED, "Requires seeded review UI fixtures");
  });

  test("review form has accessible labels, keyboard controls and no axe violations", async ({ page }) => {
    await page.goto("/dashboard/bookings/e2e-review-booking/review");
    await expect(page.getByRole("form")).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
    const result = await runAxe(page);
    expect(result.violations).toEqual([]);
  });

  test("public reviews expose headings and live moderation status", async ({ page }) => {
    await page.goto("/listings/e2e-moderated-review-listing");
    await expect(page.getByRole("region", { name: "Reputación pública" })).toBeVisible();
    await expect(page.getByRole("status")).toBeVisible();
    const result = await runAxe(page);
    expect(result.violations).toEqual([]);
  });
});