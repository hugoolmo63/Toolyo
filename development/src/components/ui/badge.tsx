import type { ReactNode } from "react";

type BadgeVariant = "success" | "warning" | "danger" | "info";

export function Badge({ variant = "info", children }: { variant?: BadgeVariant; children: ReactNode }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}