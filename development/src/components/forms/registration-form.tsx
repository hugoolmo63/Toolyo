"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegistrationSchema, type RegistrationInput } from "@/lib/validations/auth";
import { SsoButtons } from "./sso-buttons";

export function RegistrationForm() {
  const form = useForm<RegistrationInput>({ resolver: zodResolver(RegistrationSchema), defaultValues: { email: "", password: "", termsDocumentId: "", privacyDocumentId: "", marketingAccepted: false } });

  function submit(values: RegistrationInput) {
    void values;
    form.setError("root", { message: "El servicio de registro estará disponible cuando se configure el proveedor de autenticación." });
  }

  return (
    <form className="auth-form" onSubmit={form.handleSubmit(submit)} noValidate>
      <div className="form-intro">
        <p className="form-kicker">Crea tu cuenta</p>
        <h1>Alquila con confianza.</h1>
        <p>Empieza a explorar herramientas y objetos cerca de ti.</p>
      </div>
      <label htmlFor="registration-email">Email</label>
      <input id="registration-email" type="email" autoComplete="email" {...form.register("email")} aria-invalid={Boolean(form.formState.errors.email)} aria-describedby="registration-email-error" />
      {form.formState.errors.email && <p className="field-error" id="registration-email-error" role="alert">{form.formState.errors.email.message}</p>}
      <label htmlFor="registration-password">Contraseña</label>
      <input id="registration-password" type="password" autoComplete="new-password" {...form.register("password")} aria-invalid={Boolean(form.formState.errors.password)} aria-describedby="registration-password-error" />
      <p className="field-hint">Mínimo 12 caracteres.</p>
      {form.formState.errors.password && <p className="field-error" id="registration-password-error" role="alert">{form.formState.errors.password.message}</p>}
      <label className="check-row" htmlFor="terms-accepted"><input id="terms-accepted" type="checkbox" {...form.register("termsDocumentId", { setValueAs: (checked) => checked ? "cmtermsplaceholder" : "" })} /><span>Acepto los <a href="/legal/terms">Términos y Condiciones</a>.</span></label>
      <label className="check-row" htmlFor="privacy-accepted"><input id="privacy-accepted" type="checkbox" {...form.register("privacyDocumentId", { setValueAs: (checked) => checked ? "cmprivacyplaceholder" : "" })} /><span>He leído la <a href="/legal/privacy">Política de Privacidad</a>.</span></label>
      <label className="check-row optional" htmlFor="marketing-accepted"><input id="marketing-accepted" type="checkbox" {...form.register("marketingAccepted")} /><span>Quiero recibir novedades y oportunidades de Toolyo.</span></label>
      {form.formState.errors.root && <p className="form-error" role="alert">{form.formState.errors.root.message}</p>}
      <button className="auth-submit" type="submit">Crear cuenta</button>
      <div className="divider"><span>o continúa con</span></div>
      <SsoButtons />
      <p className="form-footnote">Los accesos SSO estarán disponibles cuando se configuren de forma segura.</p>
    </form>
  );
}
