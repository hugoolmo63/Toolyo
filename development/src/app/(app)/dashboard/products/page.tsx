import { redirect } from "next/navigation";
import { createServerApi } from "@/lib/server-api";
import { ListingManagementPanel } from "@/features/listing-management/presentation/listing-management-panel";

export default async function ProductsPage() {
  const api = await createServerApi();
  const session = await api.auth.getSession();
  if (!session) redirect("/auth?tab=login&callback=/dashboard/products");
  const products = await api.listingManagement.listMine({ page: 1, pageSize: 20 });
  return <ListingManagementPanel initialData={products} />;
}
