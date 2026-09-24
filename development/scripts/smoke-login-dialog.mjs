import puppeteer from "puppeteer";

const BASE = process.env.BASE_URL ?? "http://localhost:3001";
const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? ` — ${extra}` : ""}`);
};

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

try {
  // V1: header presente en landing y login sin cambio de URL
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 30000 });
  check("V1 header público en /", await page.$(".public-header") !== null);
  check("V1 botón Entrar (anónimo)", await page.$(".public-nav-button") !== null);

  await page.click(".public-nav-button");
  await page.waitForSelector("dialog.login-dialog[open]", { timeout: 5000 });
  check("V1 diálogo abre sin cambiar URL", page.url() === `${BASE}/`);

  // Login válido → diálogo se cierra, sesión activa en la misma página
  await page.type("#login-email", "test@test.com");
  await page.type("#login-password", "passwordpassword123");
  await page.click(".auth-submit");
  await page.waitForSelector(".user-menu-trigger", { timeout: 15000 });
  const post = await page.evaluate(() => ({
    dialogOpen: document.querySelector("dialog.login-dialog")?.open ?? false,
    url: location.pathname,
  }));
  check("V1 post-login: diálogo cerrado", post.dialogOpen === false);
  check("V1 post-login: misma página", post.url === "/");
  check("V2 menú de sesión visible", await page.$(".user-menu-trigger") !== null);

  // V2: menú desplegable con panel + logout
  await page.click(".user-menu-trigger");
  await page.waitForSelector(".user-menu-dropdown", { timeout: 3000 });
  const items = await page.$$eval(".user-menu-item", (els) => els.map((e) => e.textContent.trim()));
  check("V2 menú contiene Ir a mi panel + Cerrar sesión", items.some((t) => t.includes("panel")) && items.some((t) => t.includes("Cerrar sesión")), items.join(" | "));

  // V2: logout en página pública permanece en la página
  await page.click(".user-menu-item-button");
  await page.waitForSelector(".public-nav-button", { timeout: 15000 });
  check("V2 post-logout: header anónimo en misma página", page.url() === `${BASE}/`);

  // V3: acción protegida en listing abre diálogo (anónimo)
  const listingLink = await page.$("a[href^='/listings/']");
  if (listingLink) {
    await listingLink.click();
    await page.waitForSelector(".action-btn-book", { timeout: 15000 });
    const urlAntes = page.url();
    await page.click(".action-btn-contact");
    await page.waitForSelector("dialog.login-dialog[open]", { timeout: 5000 });
    check("V3 Contactar abre diálogo sin redirect", page.url() === urlAntes);
    // cancelar con Escape
    await page.keyboard.press("Escape");
    await new Promise((r) => setTimeout(r, 400));
    const closed = await page.evaluate(() => document.querySelector("dialog.login-dialog")?.open ?? false);
    check("V3 Escape cierra el diálogo", closed === false);
  } else {
    check("V3 listing disponible para probar acciones", false, "no se encontró enlace a listing");
  }

  // V4: acceso directo a ruta privada → /auth con callback → retorno
  await page.goto(`${BASE}/dashboard/products`, { waitUntil: "networkidle2", timeout: 30000 });
  check("V4 redirect a /auth con callback", page.url().includes("/auth") && decodeURIComponent(page.url()).includes("callback=/dashboard/products"), page.url());

  await page.type("#login-email", "test@test.com");
  await page.type("#login-password", "passwordpassword123");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
    page.click(".auth-submit"),
  ]);
  check("V4 retorna al destino original", page.url() === `${BASE}/dashboard/products`, page.url());

  // V4: /auth con sesión → redirect automático
  await page.goto(`${BASE}/auth`, { waitUntil: "networkidle2", timeout: 30000 });
  check("V4 /auth con sesión redirige a /dashboard", page.url().startsWith(`${BASE}/dashboard`), page.url());
} catch (error) {
  console.error("ERROR durante el smoke test:", error.message);
  results.push({ name: "excepción", ok: false });
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks OK`);
process.exit(failed ? 1 : 0);
