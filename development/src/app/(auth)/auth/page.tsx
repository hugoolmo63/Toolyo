import { AuthTabs } from "@/components/forms/auth-tabs";
import { createServerApi } from "@/lib/server-api";

export default async function AuthPage() {
  const api = await createServerApi();
  const legalDocuments = await api.auth.getRegistrationLegalDocuments();

  return <AuthTabs legalDocuments={legalDocuments} />;
}
