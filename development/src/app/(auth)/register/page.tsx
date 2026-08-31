import { RegistrationForm } from "@/components/forms/registration-form";
import { createServerApi } from "@/lib/server-api";

export default async function RegisterPage() {
  const api = await createServerApi();
  const legalDocuments = await api.auth.getRegistrationLegalDocuments();

  return (
    <main className="auth-page">
      <div className="auth-art" aria-hidden="true"><span>TOOLYO</span><strong>Menos compra.<br />Más posibilidad.</strong><i>01</i></div>
      <section className="auth-panel" aria-labelledby="registration-title"><RegistrationForm legalDocuments={legalDocuments} /></section>
    </main>
  );
}
