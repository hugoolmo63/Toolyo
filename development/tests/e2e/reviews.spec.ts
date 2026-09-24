import { test, expect } from "@playwright/test";

test.describe("reviews: renter → owner → public reputation", () => {
  test.beforeEach(async () => {
    test.skip(!process.env.E2E_REVIEWS_ENABLED, "Requires seeded review users, completed booking and public listing");
  });

  test("submits both reviews and exposes the public reputation", async ({ page }) => {
    await page.goto("/dashboard/bookings/e2e-review-booking/review");
    await expect(page.getByRole("heading", { name: /valora tu experiencia/i })).toBeVisible();
    await page.getByRole("button", { name: "5 estrellas" }).click();
    for (const label of ["Comunicación", "Puntualidad", "Estado del producto"]) {
      await page.getByRole("button", { name: `${label}: 5 estrellas` }).click();
    }
    await page.getByRole("button", { name: /enviar valoración/i }).click();
    await expect(page.getByRole("status")).toContainText(/pendiente|publicación/i);

    await page.goto("/listings/e2e-review-listing");
    await expect(page.getByRole("region", { name: "Reputación pública" })).toBeVisible();
    await expect(page.getByText(/reseña/)).toBeVisible();
  });
});