import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Layout público — header mínimo sin nav de usuario logado.
 * La landing de búsqueda es accesible sin sesión (004-public-search FR-001).
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-layout">
      <header className="public-header">
        <Link href="/" className="public-logo" aria-label="Toolyo inicio">
          Toolyo
        </Link>
        <nav className="public-nav">
          <Link href="/auth?tab=login" className="public-nav-link">
            Iniciar sesión
          </Link>
          <Link href="/auth?tab=register" className="public-nav-link public-nav-cta">
            Crear cuenta
          </Link>
        </nav>
      </header>
      <main className="public-main">{children}</main>
    </div>
  );
}
