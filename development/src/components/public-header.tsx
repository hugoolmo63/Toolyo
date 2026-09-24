import Link from "next/link";
import { UserMenu } from "@/components/auth/user-menu";

/**
 * Header público compartido (007-login-contextual).
 * Lo usan el layout de `(public)` y la landing `/` (que no pasa por ese layout).
 */
export function PublicHeader() {
  return (
    <header className="public-header">
      <Link href="/" className="public-logo" aria-label="Toolyo inicio">
        Toolyo
      </Link>
      <nav className="public-nav" aria-label="Acceso de usuario">
        <UserMenu />
      </nav>
    </header>
  );
}
