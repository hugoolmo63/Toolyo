"use client";

import { useState } from "react";
import type { IdentityVerificationStatus } from "@/types/auth";

export function KycStatusCard({ initialStatus = "not_started" }: { initialStatus?: IdentityVerificationStatus }) {
  const [status, setStatus] = useState<IdentityVerificationStatus>(initialStatus);
  const pending = status === "pending";
  const label = { not_started: "¿Qué incluye?", pending: "Solicitud pendiente", verified: "Identidad verificada", rejected: "No hemos podido verificarla", retry_required: "Necesita otro intento" }[status];
  const description = { not_started: "DNI/NIE y selfie en vivo a través de un proveedor especializado.", pending: "Te avisaremos cuando tengamos novedades.", verified: "Tu identidad está confirmada.", rejected: "Revisa los datos y vuelve a intentarlo.", retry_required: "Puedes iniciar una nueva comprobación." }[status];
  return <div><div className={`kyc-status ${status}`} aria-live="polite"><span className="status-icon" aria-hidden="true">{status === "pending" ? "…" : status === "verified" ? "✓" : "i"}</span><div><strong>{label}</strong><p>{description}</p></div></div><button className="auth-submit" type="button" onClick={() => setStatus("pending")} disabled={pending || status === "verified"}>{pending ? "Verificación iniciada" : status === "verified" ? "Identidad verificada" : "Empezar verificación"}</button></div>;
}
