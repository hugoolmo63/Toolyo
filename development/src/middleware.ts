import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env.mjs";

/**
 * Middleware de Next.js para proteger rutas autenticadas (003-login).
 * Si no existe la cookie de sesión, redirige a /auth?tab=login&callback=<destino>.
 * La validación del token se hace en el contexto tRPC y en Server Components;
 * el middleware solo comprueba existencia de la cookie para evitar render de
 * páginas protegidas sin sesión.
 */
export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(env.SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    const callback = request.nextUrl.pathname + request.nextUrl.search;
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("tab", "login");
    loginUrl.searchParams.set("callback", callback);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protege el route group (app) — todo bajo /dashboard, /profile, etc.
    "/dashboard/:path*",
    "/profile/:path*",
    "/messages/:path*",
    "/admin/:path*",
    // Excluye rutas públicas, auth, API y legales
  ],
};
