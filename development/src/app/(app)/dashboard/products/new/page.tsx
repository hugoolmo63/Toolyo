import { redirect } from "next/navigation";
import { createServerApi } from "@/lib/server-api";
import { ListingForm } from "@/features/listing-management/presentation/listing-form";

export default async function NewProductPage() {
  const api = await createServerApi();
  const session = await api.auth.getSession();
  if (!session) redirect("/auth?tab=login&callback=/dashboard/products/new");
  const categories = await api.category.list();
  return <ListingForm categories={categories.map((category) => ({ id: category.id, name: category.name }))} />;
}
