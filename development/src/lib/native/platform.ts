import { Capacitor } from "@capacitor/core";

export type AppPlatform = "web" | "android" | "ios";

/**
 * Normaliza el valor de plataforma de Capacitor a nuestro dominio.
 * Puro y testeable (no depende del runtime).
 */
export function normalizePlatform(raw: string | null | undefined): AppPlatform {
  return raw === "android" || raw === "ios" ? raw : "web";
}

/**
 * Plataforma efectiva. Devuelve "web" durante SSR y en navegador.
 */
export function getAppPlatform(): AppPlatform {
  if (typeof window === "undefined") {
    return "web";
  }
  try {
    return normalizePlatform(Capacitor.getPlatform());
  } catch {
    return "web";
  }
}

/**
 * True cuando la app corre dentro del shell nativo (Android/iOS).
 */
export function isNativeShell(): boolean {
  return getAppPlatform() !== "web";
}

/**
 * Destinos que la app móvil no expone (herramientas internas de escritorio).
 * El backoffice permanece accesible solo desde web (FR-014).
 */
const BLOCKED_MOBILE_PREFIXES = ["/admin"] as const;

export function isBlockedOnMobile(pathname: string): boolean {
  return BLOCKED_MOBILE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
