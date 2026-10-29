import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuración del shell nativo (Capacitor sobre la app Next.js).
 */
// Usamos localhost para desarrollo local estable en el Simulador de iOS
const serverUrl = "http://localhost:3000";

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

const allowRuntimeOverride =
  process.env.MOBILE_ALLOW_RUNTIME_OVERRIDE === "true";

const allowNavigation = [
  ...(allowRuntimeOverride ? ["*"] : host ? [host, "127.0.0.1"] : []),
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
    CapacitorCookies: { enabled: true },
  },
};

export default config;