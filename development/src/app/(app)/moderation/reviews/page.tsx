import { createServerApi } from "@/lib/server-api";
import { ReviewModerationPanel } from "@/features/reviews/presentation/review-moderation-panel";

export default async function ReviewModerationPage() {
  const api = await createServerApi();
  try {
    const reports = await api.reviews.getPendingReports();
    return <ReviewModerationPanel initialReports={reports.map((report) => ({ ...report, createdAt: report.createdAt.toString() }))} />;
  } catch {
    return <main className="moderation-page"><h1 className="page-title">Moderación de reseñas</h1><p role="alert" className="form-error">No tienes permisos para acceder a este panel.</p></main>;
  }
}