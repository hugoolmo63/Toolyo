import type { ReactNode } from "react";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

/**
 * Layout público — header mínimo con zona de sesión (007-login-contextual).
 * La landing de búsqueda es accesible sin sesión (004-public-search FR-001).
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-layout">
      <PublicHeader />
      <main className="public-main">{children}</main>
      <PublicFooter />
    </div>
  );
}
