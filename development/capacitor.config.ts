import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuración del shell nativo (Capacitor sobre la app Next.js).
 *
 * La interfaz se carga desde `webDir` dentro del paquete nativo para que la
 * aplicación pueda abrirse aunque el endpoint de API no esté disponible.
 * `MOBILE_SERVER_URL` se utiliza por la aplicación para sus peticiones de API,
 * no como origen remoto del WebView.
 */
const config: CapacitorConfig = {
  appId: "com.toolyo.app",
  appName: "Toolyo",
  webDir: "capacitor/www",
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
