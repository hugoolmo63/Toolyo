import { RegistrationForm } from "@/components/forms/registration-form";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <div className="auth-art" aria-hidden="true"><span>TOOLYO</span><strong>Menos compra.<br />Más posibilidad.</strong><i>01</i></div>
      <section className="auth-panel" aria-labelledby="registration-title"><RegistrationForm /></section>
    </main>
  );
}
