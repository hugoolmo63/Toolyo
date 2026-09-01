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
    <main className="legal-page" style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <h1 style={{ margin: 0 }}>Tu panel</h1>
        <LogoutButton />
      </div>

      <section style={{ marginBottom: 32 }}>
        <p style={{ color: "var(--ps-neutral-600)" }}>Estado de tu cuenta: <strong>{onboarding.accountStatus}</strong></p>
        <p style={{ color: "var(--ps-neutral-600)" }}>Email: <strong>{onboarding.email}</strong></p>
      </section>

      <section style={{ display: "grid", gap: 16, marginBottom: 32 }}>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Verificaciones</h2>
        <div className="kyc-status">
          <div className="status-icon" aria-hidden="true">{onboarding.email === "verified" ? "✓" : "!"}</div>
          <div>
            <strong>Email</strong>
            <p>{onboarding.email === "verified" ? "Verificado" : "Pendiente — verifica tu email para desbloquear todas las funciones."}</p>
            {onboarding.email !== "verified" && (
              <p><a href="/verify" style={{ color: "var(--ps-primary-700)", fontWeight: 600 }}>Verificar email →</a></p>
            )}
          </div>
        </div>
        <div className="kyc-status">
          <div className="status-icon" aria-hidden="true">{onboarding.phone === "verified" ? "✓" : "!"}</div>
          <div>
            <strong>Teléfono</strong>
            <p>{onboarding.phone === "verified" ? "Verificado" : "Pendiente — añade y verifica tu teléfono."}</p>
          </div>
        </div>
        <div className="kyc-status">
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
              <p><a href="/kyc" style={{ color: "var(--ps-primary-700)", fontWeight: 600 }}>Iniciar KYC →</a></p>
            )}
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ margin: 0, fontSize: "1.25rem", marginBottom: 12 }}>Capacidades disponibles</h2>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
          {Object.entries(onboarding.capabilities).map(([key, enabled]) => (
            <li key={key} style={{ display: "flex", gap: 8, alignItems: "center", color: enabled ? "var(--ps-neutral-900)" : "var(--ps-neutral-500)" }}>
              <span aria-hidden="true">{enabled ? "✓" : "○"}</span>
              <span>{key.replace(/_/g, " ")}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
