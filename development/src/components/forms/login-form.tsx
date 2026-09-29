"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginSchema, type LoginInput } from "@/lib/validations/auth";
import { api } from "@/lib/trpc-react";

interface LoginFormProps { variant?: "page" | "dialog"; onSuccess?: () => void; }

export function LoginForm({ variant = "page", onSuccess }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = api.useUtils();
  const callback = searchParams.get("callback") ?? "/dashboard";
  const isDialog = variant === "dialog";
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<string | null>(searchParams.get("twoFactor") === "required" ? "pending-login-challenge" : null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const form = useForm<LoginInput>({ resolver: zodResolver(LoginSchema), defaultValues: { email: "", password: "", rememberMe: false, callback } });

  const loginMutation = api.auth.loginWithPassword.useMutation({
    onSuccess: async (data) => {
      if (data.sessionState === "PENDING_2FA" && data.challengeId) { setTwoFactorChallenge(data.challengeId); return; }
      if (isDialog) { await utils.auth.getSession.invalidate(); router.refresh(); onSuccess?.(); return; }
      router.push(data.callback); router.refresh();
    },
    onError: (error) => form.setError("root", { message: error.message || "No se ha podido iniciar sesión." }),
  });
  const verifyTotpMutation = api.admin.verifyTotp.useMutation({
    onSuccess: (data) => { router.push(isDialog ? callback : data.redirectTo); router.refresh(); },
    onError: (error) => form.setError("root", { message: error.message || "No se pudo verificar el segundo factor." }),
  });

  if (twoFactorChallenge) return <form className="auth-form" onSubmit={(event) => { event.preventDefault(); verifyTotpMutation.mutate({ challengeId: twoFactorChallenge, code: twoFactorCode }); }}><div className="form-intro"><p className="form-kicker">Verificación adicional</p><h1>Confirma tu acceso.</h1><p>Introduce el código de seis dígitos de tu aplicación de autenticación.</p></div><label htmlFor="totp-code">Código de autenticación</label><input id="totp-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} required />{form.formState.errors.root && <p className="form-error" role="alert">{form.formState.errors.root.message}</p>}<button className="auth-submit" type="submit" disabled={verifyTotpMutation.isPending}>{verifyTotpMutation.isPending ? "Verificando..." : "Verificar código"}</button></form>;

  return <form className="auth-form" onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))} noValidate><div className="form-intro"><p className="form-kicker">Bienvenido de nuevo</p><h1 id={isDialog ? "login-dialog-title" : undefined}>Inicia sesión.</h1><p>Accede a tu cuenta para continuar.</p></div><label htmlFor="login-email">Email</label><input id="login-email" type="email" autoComplete="email" {...form.register("email")} aria-invalid={Boolean(form.formState.errors.email)} aria-describedby="login-email-error" />{form.formState.errors.email && <p className="field-error" id="login-email-error" role="alert">{form.formState.errors.email.message}</p>}<label htmlFor="login-password">Contraseña</label><input id="login-password" type="password" autoComplete="current-password" {...form.register("password")} aria-invalid={Boolean(form.formState.errors.password)} aria-describedby="login-password-error" />{form.formState.errors.password && <p className="field-error" id="login-password-error" role="alert">{form.formState.errors.password.message}</p>}<label className="check-row" htmlFor="remember-me"><input id="remember-me" type="checkbox" {...form.register("rememberMe")} /><span>Mantener mi sesión iniciada durante 30 días.</span></label>{form.formState.errors.root && <p className="form-error" role="alert">{form.formState.errors.root.message}</p>}<button className="auth-submit" type="submit" disabled={loginMutation.isPending}>{loginMutation.isPending ? "Iniciando sesión..." : "Iniciar sesión"}</button><p className="auth-switch">¿Aún no estás registrado? <a href="/auth?tab=register" onClick={isDialog ? onSuccess : undefined}>¡No tardes!</a></p></form>;
}