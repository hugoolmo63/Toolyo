import { test, expect, type Page, type Browser, type BrowserContext } from "@playwright/test";

/**
 * Batería de tests de navegación (spec 010-navigation-test-suite).
 *
 * Comprobación de humo de la navegación pública: rutas, enlaces principales
 * y protección de rutas para visitante anónimo. Solo lectura: ningún test
 * envía formularios ni muta datos.
 *
 * Cada test graba vídeo de evidencia en test-results/ (FR-010).
 */

// FR-010: evidencia en vídeo de cada comprobación, siempre conservada
test.use({ video: "on" });

// ── Helpers (Phase 2: Foundational) ─────────────────────────────────────────

/**
 * Verifica que la página no muestra señales de error (FR-002):
 * ni página de "no encontrado" de Next.js ni error boundary de cliente.
 */
async function expectNoErrorSignals(page: Page) {
  await expect(page.getByText("This page could not be found")).toHaveCount(0);
  await expect(page.getByText("Application error")).toHaveCount(0);
  await expect(page.locator("nextjs-portal")).toHaveCount(0);
}

/**
 * Carga una ruta pública y verifica: status < 400, ancla de contenido visible
 * y ausencia de señales de error (FR-001, FR-002).
 */
async function checkPublicRoute(page: Page, path: string, anchor: string) {
  const response = await page.goto(path);
  expect(response, `Sin respuesta HTTP al cargar ${path}`).not.toBeNull();
  expect(response!.status(), `${path} devolvió status ${response!.status()}`).toBeLessThan(400);
  await expect(page.locator(anchor).first()).toBeVisible();
  await expectNoErrorSignals(page);
}

/**
 * Descubre en tiempo de ejecución el href del primer enlace que empiece por
 * `prefix` en la página de inicio. Devuelve null si no hay datos (seed vacío),
 * para que el test falle con mensaje claro en lugar de timeout (research.md D3).
 */
async function discoverHref(page: Page, prefix: string): Promise<string | null> {
  await checkPublicRoute(page, "/", ".public-header");
  return page.locator(`a[href^='${prefix}']`).first().getAttribute("href");
}

// ── US1: rutas públicas ─────────────────────────────────────────────────────

test.describe("rutas públicas", () => {
  test("GET / responde y renderiza la landing de búsqueda", async ({ page }) => {
    await checkPublicRoute(page, "/", ".public-header");
  });

  test("GET /search responde y renderiza la página de búsqueda", async ({ page }) => {
    await checkPublicRoute(page, "/search", ".public-header");
  });

  test("GET /auth responde y renderiza el formulario de acceso", async ({ page }) => {
    await checkPublicRoute(page, "/auth", ".auth-page");
    await expect(page.locator("#login-email")).toBeVisible();
  });

  test("GET /register redirige a /auth?tab=register", async ({ page }) => {
    // /register es un redirect a la pestaña de registro de /auth
    await page.goto("/register");
    await expect(page).toHaveURL(/\/auth\?.*tab=register/);
    await expect(page.locator(".auth-page")).toBeVisible();
  });

  test("GET /verify responde y renderiza la página de verificación", async ({ page }) => {
    await checkPublicRoute(page, "/verify", ".auth-page");
  });

  test("GET /legal/terms renderiza los términos y condiciones", async ({ page }) => {
    await checkPublicRoute(page, "/legal/terms", "main.legal-page");
  });

  test("GET /legal/privacy renderiza la política de privacidad", async ({ page }) => {
    await checkPublicRoute(page, "/legal/privacy", "main.legal-page");
  });

  test("GET /legal/inexistente devuelve la página de no encontrado", async ({ page }) => {
    const response = await page.goto("/legal/inexistente");
    expect(response, "Sin respuesta HTTP").not.toBeNull();
    expect(response!.status()).toBe(404);
  });

  test("GET /categories responde y renderiza el listado", async ({ page }) => {
    await checkPublicRoute(page, "/categories", ".page-title");
  });

  test("GET /listings/<slug> renderiza el detalle del anuncio", async ({ page }) => {
    const href = await discoverHref(page, "/listings/");
    expect(href, "no se encontró enlace a listing en / — ¿falta el seed de datos?").not.toBeNull();
    const response = await page.goto(href!);
    expect(response!.status(), `${href} devolvió status ${response!.status()}`).toBeLessThan(400);
    await expect(page.locator(".action-btn-book")).toBeVisible();
    await expectNoErrorSignals(page);
  });

  test("GET /users/<id> renderiza el perfil público", async ({ page }) => {
    // Los enlaces a /users/ viven en el detalle del anuncio (owner card, reseñas)
    const listingHref = await discoverHref(page, "/listings/");
    expect(listingHref, "no se encontró enlace a listing en / — ¿falta el seed de datos?").not.toBeNull();
    await page.goto(listingHref!);
    const href = await page.locator("a[href^='/users/']").first().getAttribute("href");
    expect(href, `no se encontró enlace a perfil de usuario en ${listingHref}`).not.toBeNull();
    const response = await page.goto(href!);
    expect(response!.status(), `${href} devolvió status ${response!.status()}`).toBeLessThan(400);
    await expect(page.locator(".user-profile-page")).toBeVisible();
    await expectNoErrorSignals(page);
  });
});

// ── US2: navegación entre páginas ───────────────────────────────────────────

test.describe("navegación", () => {
  test("el logo de la cabecera lleva a /", async ({ page }) => {
    await checkPublicRoute(page, "/search", ".public-header");
    await page.locator("a.public-logo").click();
    await expect(page).toHaveURL("/");
  });

  test("Entrar abre el diálogo de login sin cambiar de página", async ({ page }) => {
    await checkPublicRoute(page, "/", ".public-header");
    await page.locator(".public-nav-button").click();
    await expect(page.locator("dialog.login-dialog[open]")).toBeVisible();
    await expect(page).toHaveURL("/");
  });

  test("el enlace de registro de la cabecera lleva a /auth?tab=register", async ({ page }) => {
    await checkPublicRoute(page, "/", ".public-header");
    await page.locator("a.public-nav-cta").click();
    await expect(page).toHaveURL(/\/auth\?.*tab=register/);
  });

  test("los documentos legales enlazan de vuelta al registro", async ({ page }) => {
    await checkPublicRoute(page, "/legal/terms", "main.legal-page");
    await page.locator("a[href='/register']").click();
    // /register redirige a /auth?tab=register
    await expect(page).toHaveURL(/\/auth\?.*tab=register/);
  });

  test("desde el inicio se navega al detalle de un anuncio", async ({ page }) => {
    await checkPublicRoute(page, "/", ".public-header");
    const listing = page.locator("a[href^='/listings/']").first();
    expect(await listing.count(), "no hay enlaces a listings en / — ¿falta el seed?").toBeGreaterThan(0);
    await listing.click();
    await expect(page).toHaveURL(/\/listings\//);
    await expect(page.locator(".action-btn-book")).toBeVisible();
    await expectNoErrorSignals(page);
  });
});

// ── US2: rutas protegidas (visitante anónimo) ───────────────────────────────

test.describe("rutas protegidas", () => {
  // Rutas cubiertas por el matcher de src/middleware.ts (FR-004)
  const protectedRoutes = ["/dashboard", "/dashboard/products", "/profile", "/messages"];

  for (const route of protectedRoutes) {
    test(`${route} redirige a /auth con callback`, async ({ page }) => {
      await page.goto(route);
      const url = page.url();
      expect(url, `${route} no redirigió a /auth (url final: ${url})`).toContain("/auth");
      expect(url).toContain("tab=login");
      expect(decodeURIComponent(url)).toContain(`callback=${route}`);
      await expect(page.locator(".auth-page")).toBeVisible();
    });
  }

  // Rutas del grupo (app) no cubiertas por el middleware: deben denegar acceso
  // por redirección o por mensaje de permiso denegado (T017 — hallazgos visibles)
  const layoutOnlyRoutes = [
    { route: "/moderation/reviews", denial: "No tienes permisos" },
    { route: "/categories/new", denial: "No tienes permisos" },
  ];

  for (const { route, denial } of layoutOnlyRoutes) {
    test(`${route} no es accesible en anónimo`, async ({ page }) => {
      await page.goto(route);
      const redirectedToAuth = /\/auth\?/.test(page.url());
      const denied = (await page.getByText(denial).count()) > 0 || (await page.locator("[role='alert']").count()) > 0;
      expect(
        redirectedToAuth || denied,
        `${route} es accesible para visitante anónimo — posible hallazgo de seguridad`
      ).toBe(true);
    });
  }
});

// ── US4: flujos de usuario (autenticados) ───────────────────────────────────
// Credenciales del seed: test@test.com / passwordpassword123.
// Estos journeys crean datos en el entorno de pruebas (FR-008): productos con
// prefijo E2E que se retiran al final, conversaciones y solicitudes de reserva.

const TEST_EMAIL = "test@test.com";
const TEST_PASSWORD = "passwordpassword123";

/** Login contextual desde la landing: Entrar → diálogo → sesión activa. */
async function loginViaDialog(page: Page) {
  await checkPublicRoute(page, "/", ".public-header");
  await page.locator(".public-nav-button").click();
  await expect(page.locator("dialog.login-dialog[open]")).toBeVisible();
  await page.locator("#login-email").fill(TEST_EMAIL);
  await page.locator("#login-password").fill(TEST_PASSWORD);
  await page.locator(".auth-submit").click();
  // El submit del login puede tardar varios segundos (mutación + rerender)
  await expect(page.locator(".user-menu-trigger")).toBeVisible({ timeout: 15000 });
}

/** Devuelve hasta `limit` hrefs de anuncios distintos descubiertos en `/`. */
async function discoverListingHrefs(page: Page, limit = 3): Promise<string[]> {
  await checkPublicRoute(page, "/", ".public-header");
  const hrefs = await page.locator("a[href^='/listings/']").evaluateAll((els) =>
    els.map((el) => el.getAttribute("href")).filter((h): h is string => Boolean(h))
  );
  return [...new Set(hrefs)].slice(0, limit);
}

test.describe("flujos de usuario", () => {
  // Los journeys pueden reintentar sobre varios anuncios descubiertos
  test.describe.configure({ timeout: 90_000 });

  // El login tiene rate limit (5/min por email+IP — login.service.ts), así que
  // la batería autentica UNA vez en beforeAll y los journeys reutilizan la
  // sesión vía storageState. Solo el journey de logout hace un segundo login
  // propio (es el que debe verificar el cierre de sesión real).
  let sessionState: Awaited<ReturnType<BrowserContext["storageState"]>>;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginViaDialog(page);
    sessionState = await context.storageState();
    await context.close();
  });

  /** Nueva página autenticada con la sesión compartida y vídeo de evidencia. */
  async function authedPage(browser: Browser) {
    const context = await browser.newContext({
      storageState: sessionState,
      recordVideo: { dir: "test-results", size: { width: 1280, height: 720 } },
    });
    return { context, page: await context.newPage() };
  }

  test("login contextual → panel → logout", async ({ page }) => {
    await loginViaDialog(page);

    // Ir al panel desde el menú de sesión
    await page.locator(".user-menu-trigger").click();
    await page.locator(".user-menu-item", { hasText: "panel" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator(".client-dashboard-shell")).toBeVisible();

    // Cerrar sesión → vuelve al estado anónimo
    await page.goto("/");
    await page.locator(".user-menu-trigger").click();
    await page.locator(".user-menu-item-button").click();
    await expect(page.locator(".public-nav-button")).toBeVisible();
  });

  test("publicar producto → aparece en el panel → retirar", async ({ browser }) => {
    const { context, page } = await authedPage(browser);
    try {

    const title = `E2E Nav ${Date.now()}`;
    await page.goto("/dashboard/products/new");
    await page.locator("input[name='title']").fill(title);
    await page.locator("textarea[name='description']").fill("Producto creado por la batería de navegación E2E.");
    await page.locator("select[name='categoryId']").selectOption({ index: 1 });
    await page.locator("input[name='pricePerDay']").fill("10");
    await page.locator("input[name='city']").fill("Madrid");
    await page.locator("input[name='addressText']").fill("Calle de prueba 1");

    // Publicar requiere al menos una imagen (schema CreateListingManagement)
    await page.getByRole("button", { name: "Añadir imagen" }).click();
    await page.locator(".photo-row input").first().fill("https://picsum.photos/seed/e2e-nav/800/600.jpg");

    await page.getByRole("button", { name: "Publicar al crear" }).click();

    // Aterriza en la ficha privada del producto
    await expect(page).toHaveURL(/\/dashboard\/products\/.+/);
    await expect(page.locator(".listing-detail-private")).toBeVisible();
    await expect(page.locator(".listing-detail-private")).toContainText(title);

    // Limpieza: retirar el producto creado
    await page.getByRole("button", { name: "Retirar producto" }).click();
    await page.getByRole("button", { name: "Confirmar retirada" }).click();
    await expect(page).toHaveURL("/dashboard/products");
    } finally {
      await context.close();
    }
  });

  test("buscar → contactar → enviar mensaje al arrendador", async ({ browser }) => {
    const { context, page } = await authedPage(browser);
    try {
    const hrefs = await discoverListingHrefs(page);
    expect(hrefs.length, "no se encontraron anuncios en / — ¿falta el seed?").toBeGreaterThan(0);

    // Contactar crea/abre la conversación vía /messages?listing=<slug>, que
    // redirige de forma asíncrona a /messages/<conversationId>
    let contacted = false;
    for (const href of hrefs) {
      await page.goto(href);
      await page.locator(".action-btn-contact").click();
      const landed = await page
        .waitForURL(/\/messages\/[^?]+$/, { timeout: 8000 })
        .then(() => true)
        .catch(() => false);
      if (landed) {
        contacted = true;
        break;
      }
      // Se queda en /messages?listing=... con error → probablemente anuncio propio
    }
    expect(contacted, "no se pudo abrir conversación con ningún anuncio descubierto").toBe(true);

    await expect(page.locator(".chat-thread")).toBeVisible();
    await page.locator(".chat-input").fill("E2E: mensaje de prueba de la batería de navegación");
    await page.locator(".chat-send").click();
    await expect(page.locator(".chat-message.is-mine").last()).toContainText("E2E: mensaje de prueba");
    } finally {
      await context.close();
    }
  });

  test("buscar → reservar → solicitud aterriza en chat contextual", async ({ browser }) => {
    const { context, page } = await authedPage(browser);
    try {
    const hrefs = await discoverListingHrefs(page);
    expect(hrefs.length, "no se encontraron anuncios en / — ¿falta el seed?").toBeGreaterThan(0);

    let booked = false;
    for (const href of hrefs) {
      await page.goto(`${href}?start=2031-07-01&end=2031-07-04`);
      await page.locator(".action-btn-book").click();
      const dialog = page.locator(".dialog", { hasText: "Solicitar reserva" });
      if (!(await dialog.isVisible().catch(() => false))) continue;

      await page.locator("[data-testid='booking-request-submit']").click();
      // Éxito: navega al chat contextual de la reserva. Error (p. ej. anuncio
      // propio): muestra .form-error dentro del diálogo → probar siguiente.
      const landed = await page
        .waitForURL(/\/messages\/[^?]+\?booking=/, { timeout: 15000 })
        .then(() => true)
        .catch(() => false);
      if (landed) {
        booked = true;
        break;
      }
      await page.keyboard.press("Escape");
    }
    expect(booked, "no se pudo solicitar reserva en ningún anuncio descubierto").toBe(true);

    await expect(page.locator(".chat-thread")).toBeVisible();
    await expect(page.locator(".booking-context-banner")).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("arrendador consulta su reserva pendiente y su contexto", async ({ browser }) => {
    const { context, page } = await authedPage(browser);
    try {
    // test@test.com es owner de seed-booking-1 (pending) según el seed
    await page.goto("/dashboard/bookings?role=owner");
    await expect(page.locator(".badge.badge-warning", { hasText: "Pendiente" }).first()).toBeVisible();

    // Abrir la conversación asociada a la reserva
    await page.locator("a[href*='/messages/'][href*='booking=']").first().click();
    await expect(page).toHaveURL(/\/messages\/[^?]+\?booking=/);
    await expect(page.locator(".chat-thread")).toBeVisible();
    await expect(page.locator(".booking-context-banner")).toBeVisible();
    } finally {
      await context.close();
    }
  });
});
