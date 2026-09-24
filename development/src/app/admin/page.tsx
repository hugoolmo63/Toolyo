import { redirect } from "next/navigation";
import { createServerApi } from "@/lib/server-api";

export default async function AdminPage() {
  const api = await createServerApi();
  try {
    const access = await api.admin.getAccess();
    if (!access.isAdminAreaEnabled) redirect("/auth?tab=login&callback=/admin");
    if (access.totp.setupRequired) redirect("/admin/setup-2fa");
    return <section className="admin-page"><h1 className="page-title">Backoffice Administrativo</h1><p>Rol activo: <strong>{access.role}</strong></p><p>2FA: <strong>{access.totp.isEnabled ? "Activo" : "Pendiente de configurar"}</strong></p></section>;
  } catch { redirect("/auth?tab=login&callback=/admin"); }
}