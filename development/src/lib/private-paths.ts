/**
 * Prefijos de rutas privadas — espejo del matcher de middleware.ts (007-login-contextual).
 * Módulo libre de dependencias de servidor (sin env.mjs) para poder importarse
 * desde Client Components sin arrastrar validación de entorno al bundle del navegador.
 */
const PRIVATE_PATH_PREFIXES = ["/dashboard", "/profile", "/messages"] as const;

export function isPrivatePathname(pathname: string): boolean {
  return PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
