"use client";

export function AdminAccessPanel({ role, isTotpEnabled }: { role: string; isTotpEnabled: boolean }) { return <section aria-label="Acceso administrativo"><p>Rol: {role}</p><p>2FA: {isTotpEnabled ? "Activo" : "Pendiente"}</p></section>; }