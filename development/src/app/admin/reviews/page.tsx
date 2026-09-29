import { createServerApi } from "@/lib/server-api";
import { ReviewModerationPanel } from "@/features/admin/presentation/review-moderation-panel";

export default async function AdminReviewsPage() { const api = await createServerApi(); const result = await api.admin.listReviewReports({ limit: 50 }); return <main className="admin-page"><h1 className="page-title">Moderación de Reviews</h1><ReviewModerationPanel reports={result.items.map((item) => ({ id: item.id, status: item.status, reason: item.reason }))} /></main>; }