import { isBlockedOnMobile } from "./platform";

export interface DeepLinkTarget {
  pathname: string;
  search: string;
}

/** Rutas internas reconocidas por la app móvil (contracts/mobile-platform.md §2.1). */
const ALLOWED_ROOTS = ["/listings", "/users", "/messages", "/search"] as const;

function isAllowed(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }
  return ALLOWED_ROOTS.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

function finalize(pathname: string, search: string): DeepLinkTarget | null {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (isBlockedOnMobile(normalized) || !isAllowed(normalized)) {
    return null;
  }
  return { pathname: normalized, search };
}

/**
 * Convierte una URL de enlace profundo (Universal/App Link `https://…` o el
 * esquema propio `toolyo://…`) en una ruta interna. Devuelve `null` si no es
 * válida, apunta al backoffice o no está permitida (FR-009).
 */
export function parseDeepLink(url: string, origin?: string): DeepLinkTarget | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol === "toolyo:") {
    const pathname = `/${parsed.host}${parsed.pathname}`.replace(/\/{2,}/g, "/");
    return finalize(pathname, parsed.search);
  }

  if (origin && parsed.origin !== origin) {
    return null;
  }

  return finalize(parsed.pathname, parsed.search);
}
