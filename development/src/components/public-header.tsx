"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/auth/user-menu";
import { SearchBar } from "@/features/search/presentation/search-bar";

/**
 * Header público compartido (007-login-contextual).
 * Lo usan el layout de `(public)` y la landing `/` (que no pasa por ese layout).
 */
export function PublicHeader() {
  const pathname = usePathname();
  const isListingDetail = pathname.startsWith("/listings/");

  return (
    <header className={`public-header${isListingDetail ? " public-header-listing" : ""}`}>
      <Link href="/" className="public-logo" aria-label="Toolyo inicio">
        Toolyo
      </Link>
      {isListingDetail && (
        <div className="public-header-search">
          <SearchBar compact />
        </div>
      )}
      <nav className="public-nav" aria-label="Acceso de usuario">
        <UserMenu />
      </nav>
    </header>
  );
}
