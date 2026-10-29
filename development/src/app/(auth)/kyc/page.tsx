import { KycStatusCard } from "@/components/forms/kyc-status-card";

export default function KycPage() {
  return <main className="auth-page"><div className="auth-art" aria-hidden="true"><span>IDENTIDAD / 03</span><strong>Más confianza,<br />cuando tú decidas.</strong></div><section className="auth-panel"><div className="auth-form"><p className="form-kicker">Opcional</p><h1>Verifica tu identidad.</h1><p>La verificación puede aportar confianza a otras personas. No es necesaria para empezar.</p><KycStatusCard /><p className="form-footnote">Tus documentos no se guardan en Toolyo por defecto. Consulta cómo tratamos tus datos antes de continuar.</p></div></section></main>;
}
