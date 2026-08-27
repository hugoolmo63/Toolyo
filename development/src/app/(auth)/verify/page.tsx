import { OtpVerificationForm } from "@/components/forms/otp-verification-form";

export default function VerifyPage() {
  return <main className="auth-page"><div className="auth-art" aria-hidden="true"><span>VERIFICACIÓN / 02</span><strong>Tu cuenta,<br />en tus manos.</strong></div><section className="auth-panel"><div><p className="form-kicker">Paso 02</p><h1>Verifica tus datos.</h1><p>Un paso pequeño para que la comunidad sea un lugar más confiable.</p><OtpVerificationForm /></div></section></main>;
}
