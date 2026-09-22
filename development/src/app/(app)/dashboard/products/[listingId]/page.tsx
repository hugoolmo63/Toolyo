import { notFound, redirect } from "next/navigation";
import { createServerApi } from "@/lib/server-api";
import { ListingDetailPrivate } from "@/features/listing-management/presentation/listing-detail-private";

export default async function ProductDetailPage({ params }: { params: { listingId: string } }) {
  const api = await createServerApi();
  const session = await api.auth.getSession();
  if (!session) redirect(`/auth?tab=login&callback=/dashboard/products/${params.listingId}`);
  try {
    const listing = await api.listingManagement.getMine({ listingId: params.listingId });
    return <ListingDetailPrivate listing={listing} />;
  } catch {
    notFound();
  }
}
