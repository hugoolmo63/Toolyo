import { redirect } from "next/navigation";
import { AuthTabs } from "@/components/forms/auth-tabs";
import { createServerApi } from "@/lib/server-api";
import { validateCallbackPath } from "@/lib/auth";

interface AuthPageProps {
  searchParams?: { callback?: string };
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const api = await createServerApi();
  // Usuario ya identificado → no mostrar el formulario (007-login-contextual, US4)
  const session = await api.auth.getSession();
  if (session) {
    redirect(validateCallbackPath(searchParams?.callback));
  }

  const legalDocuments = await api.auth.getRegistrationLegalDocuments();
  return <AuthTabs legalDocuments={legalDocuments} />;
}
