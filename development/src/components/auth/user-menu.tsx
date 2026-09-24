"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuthDialog } from "@/providers/auth-dialog-provider";
import { useSession } from "@/lib/hooks/use-session";
import { LogoutButton } from "@/components/forms/logout-button";

/**
 * Zona de sesión del header público (007-login-contextual, FR-006/FR-007).
 * Anónimo → "Entrar" abre el diálogo de login + "Crear cuenta" (página completa).
 * Identificado → menú con "Ir a mi panel" y "Cerrar sesión".
 */
export function UserMenu() {
  const { isLoading, isAuthenticated } = useSession();
  const { open } = useAuthDialog();
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: globalThis.MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  if (isLoading) {
    return <span className="user-menu-skeleton" aria-hidden="true" />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <button type="button" className="public-nav-link public-nav-button" onClick={open}>
          Entrar
        </button>
        <Link href="/auth?tab=register" className="public-nav-link public-nav-cta">
          Crear cuenta
        </Link>
      </>
    );
  }

  return (
    <div className="user-menu" ref={containerRef}>
      <button
        type="button"
        className="public-nav-link public-nav-button user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((value) => !value)}
      >
        Mi cuenta
      </button>
      {menuOpen && (
        <div className="user-menu-dropdown" role="menu" aria-label="Menú de cuenta">
          <Link
            href="/dashboard"
            role="menuitem"
            className="user-menu-item"
            onClick={() => setMenuOpen(false)}
          >
            Ir a mi panel
          </Link>
          <LogoutButton className="user-menu-item user-menu-item-button" />
        </div>
      )}
    </div>
  );
}
