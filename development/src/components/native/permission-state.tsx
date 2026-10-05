"use client";

import type { ReactNode } from "react";

export type PermissionKind = "location" | "camera" | "notifications";

const TITLES: Record<PermissionKind, string> = {
  location: "Ubicación no disponible",
  camera: "Cámara o galería no disponibles",
  notifications: "Notificaciones desactivadas",
};

/**
 * Estado de degradación controlada cuando el usuario deniega un permiso (FR-008).
 * La funcionalidad afectada se desactiva y se explica cómo habilitarla.
 */
export function PermissionState({
  kind,
  children,
}: {
  kind: PermissionKind;
  children: ReactNode;
}) {
  return (
    <div className="alert alert-warning" role="status">
      <p className="alert-title">{TITLES[kind]}</p>
      <p>{children}</p>
    </div>
  );
}
