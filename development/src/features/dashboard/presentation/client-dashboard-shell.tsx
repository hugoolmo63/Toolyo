"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/forms/logout-button";

const navigation = [
  { href: "/dashboard", label: "Resumen", icon: "⌂", enabled: true },
  { href: "/dashboard/products", label: "Mis productos", icon: "▣", enabled: true },
  { href: "/dashboard/bookings", label: "Mis alquileres", icon: "◷", enabled: true },
  { href: "/messages", label: "Mensajes", icon: "✉", enabled: true },
];

export function ClientDashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="client-dashboard-shell">
      <aside className="client-dashboard-sidebar" aria-label="Navegación del área de cliente">
        <div className="client-dashboard-brand">
          <Link href="/dashboard" aria-label="Ir al resumen de cliente">toolyo</Link>
          <span>Área de cliente</span>
        </div>
        <nav className="client-dashboard-nav">
          <p className="client-dashboard-nav-title">Gestionar</p>
          {navigation.map((item) => {
            const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            if (!item.enabled) {
              return <span key={item.href} className="client-dashboard-nav-item is-disabled" aria-disabled="true" title="Disponible próximamente"><span aria-hidden="true">{item.icon}</span>{item.label}<small>Próximamente</small></span>;
            }
            return <Link key={item.href} href={item.href} className={`client-dashboard-nav-item${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}><span aria-hidden="true">{item.icon}</span>{item.label}</Link>;
          })}
        </nav>
        <div className="client-dashboard-sidebar-footer">
          <Link
            href="/profile"
            className={`client-dashboard-nav-item${pathname.startsWith("/profile") ? " is-active" : ""}`}
            aria-current={pathname.startsWith("/profile") ? "page" : undefined}
          >
            <span aria-hidden="true">◉</span>
            Mi perfil
          </Link>
          <LogoutButton />
        </div>
      </aside>
      <main className="client-dashboard-content">{children}</main>
    </div>
  );
}
