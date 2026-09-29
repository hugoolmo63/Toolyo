import { createServerApi } from "@/lib/server-api";
import { AuditLogPanel } from "@/features/admin/presentation/audit-log-panel";

export default async function AdminAuditPage() {
  const api = await createServerApi();
  const result = await api.admin.listAuditLogs({ limit: 50 });
  return <main className="admin-page"><h1 className="page-title">Auditoría administrativa</h1><AuditLogPanel logs={result.items} /></main>;
}