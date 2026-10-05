import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuración del shell nativo (Capacitor sobre la app Next.js).
 *
 * El endpoint del servicio se define en un ÚNICO punto: `MOBILE_SERVER_URL`.
 * Nunca se hardcodea la dirección aquí (FR-016).
 * El HTTP en claro se permite solo en builds internas/de desarrollo (FR-017).
 */
const serverUrl = process.env.MOBILE_SERVER_URL?.trim() || "";
const allowCleartext = process.env.MOBILE_ALLOW_CLEARTEXT === "true";

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

const config: CapacitorConfig = {
  appId: "com.toolyo.app",
  appName: "Toolyo",
  webDir: "capacitor/www",
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: allowCleartext,
        // Solo el host configurado y dominios explícitos; nunca "*".
        allowNavigation: [...(host ? [host] : []), ...extraAllowedDomains],
      }
    : undefined,
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
