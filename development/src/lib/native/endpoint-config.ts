export interface MobileEndpointConfig {
  baseUrl: string;
  allowRuntimeOverride: boolean;
  allowCleartext: boolean;
}

export interface EndpointEnv {
  MOBILE_SERVER_URL?: string;
  MOBILE_ALLOW_CLEARTEXT?: string;
  MOBILE_ALLOW_RUNTIME_OVERRIDE?: string;
}

/** Hosts considerados de red local / intranet (FR-017). */
const LOCAL_HOST_PATTERN =
  /^(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|[a-z0-9-]+\.local)$/i;

export function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function isLocalNetworkUrl(url: string): boolean {
  const host = hostOf(url);
  return host ? LOCAL_HOST_PATTERN.test(host) : false;
}

export function isCleartextUrl(url: string): boolean {
  return /^http:\/\//i.test(url);
}

/**
 * Resuelve la configuración del endpoint desde un único punto de configuración.
 * El HTTP en claro se habilita explícitamente o, de forma implícita, para
 * direcciones de red local servidas por HTTP (FR-016/FR-017).
 */
export function resolveEndpointConfig(env: EndpointEnv = {}): MobileEndpointConfig {
  const baseUrl = (env.MOBILE_SERVER_URL ?? "").trim();
  const allowRuntimeOverride = env.MOBILE_ALLOW_RUNTIME_OVERRIDE === "true";
  const allowCleartext =
    env.MOBILE_ALLOW_CLEARTEXT === "true" ||
    (isCleartextUrl(baseUrl) && isLocalNetworkUrl(baseUrl));
  return { baseUrl, allowRuntimeOverride, allowCleartext };
}

/**
 * Verifica que la configuración no debilita la seguridad en producción.
 * Devuelve un mensaje de error o `null` si es válida.
 */
export function validateEndpointForProduction(
  config: MobileEndpointConfig,
): string | null {
  if (config.allowRuntimeOverride) {
    return "El override de endpoint en runtime no está permitido en producción.";
  }
  if (config.baseUrl && !config.baseUrl.startsWith("https://")) {
    return "El endpoint de producción debe usar HTTPS.";
  }
  return null;
}

const RUNTIME_OVERRIDE_KEY = "toolyo.mobile.endpointOverride";

export function getRuntimeOverride(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(RUNTIME_OVERRIDE_KEY);
  } catch {
    return null;
  }
}

export function setRuntimeOverride(url: string | null): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (url && url.trim()) {
      window.localStorage.setItem(RUNTIME_OVERRIDE_KEY, url.trim());
    } else {
      window.localStorage.removeItem(RUNTIME_OVERRIDE_KEY);
    }
  } catch {
    // Almacenamiento no disponible: se ignora el override.
  }
}

export function getEffectiveEndpoint(config: MobileEndpointConfig): string {
  if (config.allowRuntimeOverride) {
    return getRuntimeOverride() ?? config.baseUrl;
  }
  return config.baseUrl;
}

/**
 * Configuración efectiva en el cliente. Next inyecta los valores
 * `NEXT_PUBLIC_*` desde `MOBILE_*` en next.config.mjs.
 */
export function getEndpointConfig(): MobileEndpointConfig {
  return resolveEndpointConfig({
    MOBILE_SERVER_URL: process.env.NEXT_PUBLIC_MOBILE_SERVER_URL,
    MOBILE_ALLOW_CLEARTEXT: process.env.NEXT_PUBLIC_MOBILE_ALLOW_CLEARTEXT,
    MOBILE_ALLOW_RUNTIME_OVERRIDE: process.env.NEXT_PUBLIC_MOBILE_ALLOW_RUNTIME_OVERRIDE,
  });
}
