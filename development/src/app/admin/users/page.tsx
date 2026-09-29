import { createServerApi } from "@/lib/server-api";
import { UsersPanel } from "@/features/admin/presentation/users-panel";
import { KycReviewPanel } from "@/features/admin/presentation/kyc-review-panel";

export default async function AdminUsersPage() { const api = await createServerApi(); const result = await api.admin.listUsers({ limit: 25 }); return <main className="admin-page"><h1 className="page-title">Usuarios y KYC</h1><UsersPanel users={result.items.map((item) => ({ id: item.id, email: item.email, role: item.role, accountStatus: item.accountStatus }))} /><KycReviewPanel /></main>; }