import { createServerApi } from "@/lib/server-api";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/forms/logout-button";

export default async function DashboardPage() {
  const api = await createServerApi();
  const onboarding = await api.auth.getSession();

  if (!onboarding) {
    redirect("/auth?tab=login&callback=/dashboard");
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Tu panel</h1>
        <LogoutButton />
      </div>

      <section className="dashboard-section">
        <p>Estado de tu cuenta: <strong>{onboarding.accountStatus}</strong></p>
        <p>Email: <strong>{onboarding.email}</strong></p>
      </section>

      <section className="dashboard-section">
        <h2 className="section-title">Verificaciones</h2>
        <div className={`kyc-status ${onboarding.email === "verified" ? "verified" : "pending"}`}>
          <div className="status-icon" aria-hidden="true">{onboarding.email === "verified" ? "✓" : "!"}</div>
          <div>
            <strong>Email</strong>
            <p>{onboarding.email === "verified" ? "Verificado" : "Pendiente — verifica tu email para desbloquear todas las funciones."}</p>
            {onboarding.email !== "verified" && (
              <p><a href="/verify" className="dashboard-link">Verificar email →</a></p>
            )}
          </div>
        </div>
        <div className={`kyc-status ${onboarding.phone === "verified" ? "verified" : "pending"}`}>
          <div className="status-icon" aria-hidden="true">{onboarding.phone === "verified" ? "✓" : "!"}</div>
          <div>
            <strong>Teléfono</strong>
            <p>{onboarding.phone === "verified" ? "Verificado" : "Pendiente — añade y verifica tu teléfono."}</p>
          </div>
        </div>
        <div className={`kyc-status ${onboarding.identity}`}>
          <div className="status-icon" aria-hidden="true">{onboarding.identity === "verified" ? "✓" : "i"}</div>
          <div>
            <strong>Identidad (KYC)</strong>
            <p>
              {onboarding.identity === "verified" && "Verificada"}
              {onboarding.identity === "not_started" && "No iniciada — opcional, pero desbloquea reservas instantáneas y seguro."}
              {onboarding.identity === "pending" && "En revisión"}
              {onboarding.identity === "rejected" && "Rechazada — puedes reintentar."}
              {onboarding.identity === "retry_required" && "Reintento requerido — revisa los requisitos."}
            </p>
            {onboarding.identity !== "verified" && (
              <p><a href="/kyc" className="dashboard-link">Iniciar KYC →</a></p>
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <h2 className="section-title">Capacidades disponibles</h2>
        <ul className="capability-list">
          {Object.entries(onboarding.capabilities).map(([key, enabled]) => (
            <li key={key} className={`capability-item${enabled ? "" : " is-disabled"}`}>
              <span aria-hidden="true">{enabled ? "✓" : "○"}</span>
              <span>{key.replace(/_/g, " ")}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
