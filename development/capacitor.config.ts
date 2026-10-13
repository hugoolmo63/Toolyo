import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuración del shell nativo (Capacitor sobre la app Next.js).
 *
 * La interfaz inicial se carga desde `webDir` dentro del paquete nativo para que
 * la pantalla de conexión pueda abrirse aunque el endpoint de API no esté
 * disponible. `MOBILE_SERVER_URL` no se asigna a `server.url`; se permite como
 * destino de navegación del WebView para que `window.location.assign()` abra la
 * app remota dentro del shell y no en el navegador externo.
 */
// Endpoint temporal para la build del simulador iOS; retirar al terminar las pruebas.
const serverUrl = "http://10.26.52.22:3000";

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const host = hostOf(serverUrl);

// Dominios adicionales legítimos (auth/pago) separados por coma. Nunca "*".
const extraAllowedDomains = (process.env.MOBILE_ALLOWED_DOMAINS ?? "")
  .split(",")
  .map((domain) => domain.trim())
  .filter(Boolean);

// El usuario puede introducir cualquier IP/servidor desde la pantalla local.
// El wildcard mantiene esas navegaciones dentro del WebView en vez de abrir el
// navegador externo. Sigue siendo necesaria para builds con override runtime.
const allowRuntimeOverride =
  process.env.MOBILE_ALLOW_RUNTIME_OVERRIDE === "true";

const allowNavigation = [
  ...(allowRuntimeOverride ? ["*"] : host ? [host] : []),
  ...extraAllowedDomains,
];

const config: CapacitorConfig = {
  appId: "com.toolyo.app",
  appName: "Toolyo",
  webDir: "capacitor/www",
  server: {
    url: serverUrl,
    cleartext: true,
    allowNavigation,
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: "always",
  },
  plugins: {
    // Conserva las cookies de sesión (HttpOnly) entre lanzamientos del WebView.
    CapacitorCookies: { enabled: true },
  },
};

export default config;
