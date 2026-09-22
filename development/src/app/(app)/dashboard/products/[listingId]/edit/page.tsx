import { notFound, redirect } from "next/navigation";
import { createServerApi } from "@/lib/server-api";
import { ListingForm } from "@/features/listing-management/presentation/listing-form";

export default async function EditProductPage({ params }: { params: { listingId: string } }) {
  const api = await createServerApi();
  const session = await api.auth.getSession();
  if (!session) redirect(`/auth?tab=login&callback=/dashboard/products/${params.listingId}/edit`);
  try {
    const [listing, categories] = await Promise.all([api.listingManagement.getMine({ listingId: params.listingId }), api.category.list()]);
    return <ListingForm categories={categories.map((category) => ({ id: category.id, name: category.name }))} initialListing={listing} />;
  } catch {
    notFound();
  }
}
