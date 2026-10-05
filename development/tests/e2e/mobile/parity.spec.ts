import { devices, expect, test, type Page } from "@playwright/test";

/**
 * Paridad de la experiencia web en viewports móviles (014-app-movil-multiplataforma, US1).
 *
 * Verifica que las rutas de usuario final se renderizan y se mantienen dentro del
 * viewport (sin desbordamiento horizontal), como base de la paridad Android/iOS.
 * Solo lectura: no envía formularios ni muta datos.
 */

const MOBILE_DEVICES = ["Pixel 5", "iPhone 12"] as const;

async function expectNoErrorSignals(page: Page) {
  await expect(page.getByText("This page could not be found")).toHaveCount(0);
  await expect(page.getByText("Application error")).toHaveCount(0);
  await expect(page.locator("nextjs-portal")).toHaveCount(0);
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "contenido desbordado horizontalmente en viewport móvil").toBeLessThanOrEqual(1);
}

for (const deviceName of MOBILE_DEVICES) {
  test.describe(`paridad móvil — ${deviceName}`, () => {
    test.use({ ...devices[deviceName] });

    test("la búsqueda pública se renderiza en viewport móvil", async ({ page }) => {
      const response = await page.goto("/");
      expect(response, "sin respuesta HTTP al cargar /").not.toBeNull();
      expect(response!.status()).toBeLessThan(400);
      await expect(page.locator(".public-header").first()).toBeVisible();
      await expectNoErrorSignals(page);
      await expectNoHorizontalOverflow(page);
    });

    test("el detalle de listing mantiene el contenido dentro del viewport", async ({ page }) => {
      await page.goto("/");
      const href = await page.locator("a[href^='/listings/']").first().getAttribute("href");
      test.skip(!href, "seed sin listings publicados: no hay detalle que validar");

      const response = await page.goto(href!);
      expect(response!.status()).toBeLessThan(400);
      await expectNoErrorSignals(page);
      await expectNoHorizontalOverflow(page);
    });

    test("la búsqueda con filtros responde en viewport móvil", async ({ page }) => {
      const response = await page.goto("/search");
      expect(response!.status()).toBeLessThan(400);
      await expect(page.locator(".public-header").first()).toBeVisible();
      await expectNoErrorSignals(page);
      await expectNoHorizontalOverflow(page);
    });
  });
}
