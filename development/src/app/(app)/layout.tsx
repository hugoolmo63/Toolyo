import type { ReactNode } from "react";
import { ClientDashboardShell } from "@/features/dashboard/presentation/client-dashboard-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <ClientDashboardShell>{children}</ClientDashboardShell>;
}