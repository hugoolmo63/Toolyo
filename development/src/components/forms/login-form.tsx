"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { LoginSchema, type LoginInput } from "@/lib/validations/auth";
import { api } from "@/lib/trpc-react";
import { Button, FormField, Input } from "@/components/ui";
import { BotProtection } from "./bot-protection";

interface LoginFormProps {
  variant?: "page" | "dialog";
  onSuccess?: () => void;
  onNavigateRegister?: () => void;
  initialEmail?: string;
}

export function LoginForm({ variant = "page", onSuccess, onNavigateRegister, initialEmail = "" }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = api.useUtils();
  const callback = searchParams.get("callback") ?? "/dashboard";
  const isDialog = variant === "dialog";
  const [showPassword, setShowPassword] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<string | null>(
    searchParams.get("twoFactor") === "required" ? "pending-login-challenge" : null,
  );
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: initialEmail, password: "", rememberMe: false, callback },
  });

  const loginMutation = api.auth.loginWithPassword.useMutation({
    onSuccess: async (data) => {
      if (data.sessionState === "PENDING_2FA" && data.challengeId) {
        setTwoFactorChallenge(data.challengeId);
        return;
      }
      if (isDialog) {
        await utils.auth.getSession.invalidate();
        router.refresh();
        onSuccess?.();
        return;
      }
      router.push(data.callback);
      router.refresh();
    },
    onError: () => form.setError("root", { message: "Correo o contraseña incorrectos" }),
  });
  const recoveryMutation = api.auth.requestOtp.useMutation({
    onSuccess: () => setRecoveryMessage("Si el correo está registrado, recibirás un código para recuperar el acceso."),
    onError: () => setRecoveryMessage("No se ha podido procesar la solicitud. Inténtalo de nuevo más tarde."),
  });
  const verifyTotpMutation = api.admin.verifyTotp.useMutation({
    onSuccess: async (data) => {
      if (isDialog) {
        await utils.auth.getSession.invalidate();
        router.refresh();
        onSuccess?.();
        return;
      }
      router.push(isDialog ? callback : data.redirectTo);
      router.refresh();
    },
    onError: (error) => form.setError("root", { message: error.message || "No se pudo verificar el segundo factor." }),
  });

  if (twoFactorChallenge) {
    return (
      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          verifyTotpMutation.mutate({ challengeId: twoFactorChallenge, code: twoFactorCode });
        }}
      >
        <div className="form-intro">
          <p className="form-kicker">Verificación adicional</p>
          <h1>Confirma tu acceso.</h1>
          <p>Introduce el código de seis dígitos de tu aplicación de autenticación.</p>
        </div>
        <FormField id="totp-code" label="Código de autenticación" error={form.formState.errors.root?.message}>
          <Input
            id="totp-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={twoFactorCode}
            onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, ""))}
            required
            hasError={Boolean(form.formState.errors.root)}
          />
        </FormField>
        <Button
          className="auth-submit"
          type="submit"
          isLoading={verifyTotpMutation.isPending}
          loadingLabel="Verificando..."
          disabled={twoFactorCode.length !== 6}
        >
          Verificar código
        </Button>
      </form>
    );
  }

  if (isRecoveringPassword) {
    return (
      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          setRecoveryMessage("");
          recoveryMutation.mutate({ channel: "email", destination: recoveryEmail, purpose: "recovery" });
        }}
      >
        <div className="form-intro">
          <p className="form-kicker">Recupera tu acceso</p>
          <h1>¿Has olvidado tu contraseña?</h1>
          <p>Introduce el correo asociado a tu cuenta y te enviaremos instrucciones para recuperarla.</p>
        </div>
        <FormField id="recovery-email" label="Email">
          <Input
            id="recovery-email"
            type="email"
            autoComplete="email"
            value={recoveryEmail}
            onChange={(event) => setRecoveryEmail(event.target.value)}
            required
          />
        </FormField>
        {recoveryMessage && <p className="field-hint" role="status" aria-live="polite">{recoveryMessage}</p>}
        <Button className="auth-submit" type="submit" isLoading={recoveryMutation.isPending} loadingLabel="Enviando...">
          Enviar código de recuperación
        </Button>
        <button className="text-button" type="button" onClick={() => { setIsRecoveringPassword(false); setRecoveryMessage(""); }}>
          Volver a iniciar sesión
        </button>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={form.handleSubmit((values) => {
      if (!botToken) {
        form.setError("root", { message: "Completa la verificación «No soy un robot»." });
        return;
      }
      loginMutation.mutate({ ...values, botToken });
    })} noValidate>
      <div className="form-intro">
        <p className="form-kicker">Bienvenido de nuevo</p>
        <h1 id={isDialog ? undefined : "login-page-title"}>Inicia sesión.</h1>
        <p>Accede a tu cuenta para continuar.</p>
      </div>

      <FormField id="login-email" label="Email" error={form.formState.errors.email?.message}>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          {...form.register("email")}
          hasError={Boolean(form.formState.errors.email)}
          aria-describedby={form.formState.errors.email ? "login-email-error" : undefined}
        />
      </FormField>
      <FormField id="login-password" label="Contraseña" error={form.formState.errors.password?.message}>
        <div className="password-field">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            {...form.register("password")}
            hasError={Boolean(form.formState.errors.password)}
            aria-describedby={form.formState.errors.password ? "login-password-error" : undefined}
          />
          <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword}>
            {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
          </button>
        </div>
      </FormField>
      <button
        className="text-button forgot-password-link"
        type="button"
        onClick={() => {
          setRecoveryEmail(form.getValues("email"));
          setIsRecoveringPassword(true);
        }}
      >
        ¿Has olvidado tu contraseña?
      </button>
      <label className="check-row" htmlFor="remember-me">
        <input id="remember-me" type="checkbox" {...form.register("rememberMe")} />
        <span>Mantener mi sesión iniciada durante 30 días.</span>
      </label>
      <BotProtection value={botToken} onChange={(token) => { setBotToken(token); form.clearErrors("root"); }} />
      {form.formState.errors.root && <p className="form-error" role="alert">{form.formState.errors.root.message}</p>}
      <Button className="auth-submit" type="submit" isLoading={loginMutation.isPending} loadingLabel="Iniciando sesión...">
        Iniciar sesión
      </Button>
      <p className="auth-switch">
        ¿Aún no estás registrado?{" "}
        {isDialog && onNavigateRegister ? (
          <button className="auth-inline-link" type="button" onClick={onNavigateRegister}>Crear cuenta</button>
        ) : (
          <Link href="/register">¡No tardes!</Link>
        )}
      </p>
    </form>
  );
}