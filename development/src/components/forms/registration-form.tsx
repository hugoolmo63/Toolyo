"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { RegistrationSchema, type RegistrationInput } from "@/lib/validations/auth";
import { api } from "@/lib/trpc-react";
import type { LegalRegistrationDocument } from "@/types/auth";
import { SsoButtons } from "./sso-buttons";
import { BotProtection } from "./bot-protection";

// En checkboxes RHF devuelve el atributo `value` al marcarlos y `false` al
// no marcarlos (setValueAs no se aplica a checkboxes en esta versión).
// El mensaje de tipo cubre el caso "no aceptado" (boolean false).
const RegistrationFormSchema = RegistrationSchema.extend({
  termsDocumentId: z.string({ invalid_type_error: "Debes aceptar los Términos y Condiciones." }).min(1, "Debes aceptar los Términos y Condiciones.").cuid(),
  privacyDocumentId: z.string({ invalid_type_error: "Debes aceptar la Política de Privacidad." }).min(1, "Debes aceptar la Política de Privacidad.").cuid(),
});

export function RegistrationForm({
  legalDocuments,
  variant = "page",
  onRegistered,
  onNavigateLogin,
}: {
  legalDocuments: LegalRegistrationDocument[];
  variant?: "page" | "dialog";
  onRegistered?: (email: string, challengeId: string) => void;
  onNavigateLogin?: () => void;
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [botToken, setBotToken] = useState("");
  const termsDocumentId = legalDocuments.find((document) => document.documentType === "terms")?.id ?? "";
  const privacyDocumentId = legalDocuments.find((document) => document.documentType === "privacy")?.id ?? "";
  const form = useForm<RegistrationInput>({ resolver: zodResolver(RegistrationFormSchema), defaultValues: { email: "", password: "", termsDocumentId: "", privacyDocumentId: "", marketingAccepted: false } });
  const registerMutation = api.auth.registerWithPassword.useMutation({
    onSuccess: (data, variables) => {
      if (variant === "dialog") {
        onRegistered?.(variables.email, data.challengeId);
        return;
      }
      router.push(`/verify?email=${encodeURIComponent(variables.email)}&challengeId=${data.challengeId}`);
      router.refresh();
    },
    onError: (error) => {
      form.setError("root", { message: error.message || "No se ha podido completar el registro con esos datos." });
    },
  });

  function submit(values: RegistrationInput) {
    if (!botToken) {
      form.setError("root", { message: "Completa la verificación «No soy un robot»." });
      return;
    }
    registerMutation.mutate({ ...values, botToken });
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
      <div className="password-field">
        <input id="registration-password" type={showPassword ? "text" : "password"} autoComplete="new-password" {...form.register("password")} aria-invalid={Boolean(form.formState.errors.password)} aria-describedby="registration-password-error" />
        <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword}>
          {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
        </button>
      </div>
      <p className="field-hint">Debe contener mayúsculas, minúsculas, números y símbolos por seguridad.</p>
      {form.formState.errors.password && <p className="field-error" id="registration-password-error" role="alert">{form.formState.errors.password.message}</p>}
      <label className="check-row" htmlFor="terms-accepted"><input id="terms-accepted" type="checkbox" value={termsDocumentId} {...form.register("termsDocumentId")} aria-invalid={Boolean(form.formState.errors.termsDocumentId)} aria-describedby="terms-accepted-error" /><span>Acepto los <a href="/terms">Términos y Condiciones</a>.</span></label>
      {form.formState.errors.termsDocumentId && <p className="field-error" id="terms-accepted-error" role="alert">{form.formState.errors.termsDocumentId.message}</p>}
      <label className="check-row" htmlFor="privacy-accepted"><input id="privacy-accepted" type="checkbox" value={privacyDocumentId} {...form.register("privacyDocumentId")} aria-invalid={Boolean(form.formState.errors.privacyDocumentId)} aria-describedby="privacy-accepted-error" /><span>He leído la <a href="/privacy">Política de Privacidad</a>.</span></label>
      {form.formState.errors.privacyDocumentId && <p className="field-error" id="privacy-accepted-error" role="alert">{form.formState.errors.privacyDocumentId.message}</p>}
      <label className="check-row optional" htmlFor="marketing-accepted"><input id="marketing-accepted" type="checkbox" {...form.register("marketingAccepted")} /><span>Quiero recibir novedades y oportunidades de Toolyo.</span></label>
      {form.formState.errors.root && <p className="form-error" role="alert">{form.formState.errors.root.message}</p>}
      <BotProtection value={botToken} onChange={(token) => { setBotToken(token); form.clearErrors("root"); }} />
      <button className="auth-submit" type="submit" disabled={registerMutation.isPending}>{registerMutation.isPending ? "Creando cuenta..." : "Crear cuenta"}</button>
      <p className="auth-switch">
        ¿Ya tienes cuenta?{" "}
        {variant === "dialog" && onNavigateLogin ? (
          <button className="auth-inline-link" type="button" onClick={onNavigateLogin}>Inicia sesión</button>
        ) : (
          <a href="/auth?tab=login">Inicia sesión</a>
        )}
      </p>
      <div className="divider"><span>o continúa con</span></div>
      <SsoButtons />
      <p className="form-footnote">Los accesos SSO estarán disponibles cuando se configuren de forma segura.</p>
    </form>
  );
}
