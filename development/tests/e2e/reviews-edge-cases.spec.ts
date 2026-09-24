import { test, expect } from "@playwright/test";

test.describe("reviews: expiration, single review and moderation states", () => {
  test.beforeEach(async () => {
    test.skip(!process.env.E2E_REVIEWS_ENABLED, "Requires seeded review edge-case fixtures");
  });

  test("shows a hidden first review only in the participant flow", async ({ page }) => {
    await page.goto("/dashboard/bookings/e2e-expired-review-booking/review");
    await expect(page.getByText(/pendiente|doble ciego/i)).toBeVisible();
    await page.goto("/listings/e2e-hidden-review-listing");
    await expect(page.getByText(/aún no tiene valoraciones|0 reseñas/i)).toBeVisible();
  });

  test("keeps an under-review report visible and announces its state", async ({ page }) => {
    await page.goto("/listings/e2e-moderated-review-listing");
    await expect(page.getByRole("status")).toContainText(/sigue visible|siendo revisada/i);
  });
});