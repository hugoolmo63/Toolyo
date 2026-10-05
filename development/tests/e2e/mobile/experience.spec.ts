import { devices, expect, test, type Page } from "@playwright/test";

/**
 * Experiencia móvil (014-app-movil-multiplataforma, US3).
 *
 * Verifica la configuración de viewport para áreas seguras y que las rutas clave
 * no desbordan horizontalmente en dispositivos con notch. La cámara, la
 * geolocalización y las notificaciones nativas se validan en dispositivo
 * (ver specs/014-app-movil-multiplataforma/quickstart.md).
 */

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "contenido desbordado horizontalmente").toBeLessThanOrEqual(1);
}

async function runAxe(page: Page) {
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  return page.evaluate(async () => {
    const axe = (window as Window & { axe?: { run: () => Promise<{ violations: Array<{ id: string }> }> } }).axe;
    if (!axe) throw new Error("axe-core no está disponible");
    return axe.run();
  });
}

test.describe("experiencia móvil — iPhone 12 (notch)", () => {
  test.use({ ...devices["iPhone 12"] });

  test("declara viewport-fit=cover para respetar las áreas seguras", async ({ page }) => {
    await page.goto("/");
    const content = await page.locator('meta[name="viewport"]').first().getAttribute("content");
    expect(content ?? "").toContain("viewport-fit=cover");
  });

  test("la landing no desborda horizontalmente", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".public-header").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("la búsqueda no desborda horizontalmente", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator(".public-header").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("la landing no tiene violaciones de accesibilidad (axe)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".public-header").first()).toBeVisible();
    const result = await runAxe(page);
    expect(result.violations).toEqual([]);
  });
});
