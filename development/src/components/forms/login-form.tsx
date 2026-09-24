"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginSchema, type LoginInput } from "@/lib/validations/auth";
import { api } from "@/lib/trpc-react";

interface LoginFormProps {
  /** "page" (default): redirige al callback tras login. "dialog": sin navegación — invalida sesión, refresca RSC y llama onSuccess (007-login-contextual). */
  variant?: "page" | "dialog";
  onSuccess?: () => void;
}

export function LoginForm({ variant = "page", onSuccess }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = api.useUtils();
  const callback = searchParams.get("callback") ?? "/dashboard";
  const isDialog = variant === "dialog";

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "", rememberMe: false, callback },
  });

  const loginMutation = api.auth.loginWithPassword.useMutation({
    onSuccess: async (data) => {
      if (isDialog) {
        await utils.auth.getSession.invalidate();
        router.refresh();
        onSuccess?.();
        return;
      }
      router.push(data.callback);
      router.refresh();
    },
    onError: (error) => {
      form.setError("root", { message: error.message || "No se ha podido iniciar sesión." });
    },
  });

  function submit(values: LoginInput) {
    loginMutation.mutate(values);
  }

  return (
    <form className="auth-form" onSubmit={form.handleSubmit(submit)} noValidate>
      <div className="form-intro">
        <p className="form-kicker">Bienvenido de nuevo</p>
        <h1 id={isDialog ? "login-dialog-title" : undefined}>Inicia sesión.</h1>
        <p>Accede a tu cuenta para continuar.</p>
      </div>
      <label htmlFor="login-email">Email</label>
      <input
        id="login-email"
        type="email"
        autoComplete="email"
        {...form.register("email")}
        aria-invalid={Boolean(form.formState.errors.email)}
        aria-describedby="login-email-error"
      />
      {form.formState.errors.email && (
        <p className="field-error" id="login-email-error" role="alert">
          {form.formState.errors.email.message}
        </p>
      )}
      <label htmlFor="login-password">Contraseña</label>
      <input
        id="login-password"
        type="password"
        autoComplete="current-password"
        {...form.register("password")}
        aria-invalid={Boolean(form.formState.errors.password)}
        aria-describedby="login-password-error"
      />
      {form.formState.errors.password && (
        <p className="field-error" id="login-password-error" role="alert">
          {form.formState.errors.password.message}
        </p>
      )}
      <label className="check-row" htmlFor="remember-me">
        <input id="remember-me" type="checkbox" {...form.register("rememberMe")} />
        <span>Mantener mi sesión iniciada durante 30 días.</span>
      </label>
      {form.formState.errors.root && (
        <p className="form-error" role="alert">
          {form.formState.errors.root.message}
        </p>
      )}
      <button className="auth-submit" type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? "Iniciando sesión..." : "Iniciar sesión"}
      </button>
      <p className="auth-switch">
        ¿Aún no estás registrado?{" "}
        <a href="/auth?tab=register" onClick={isDialog ? onSuccess : undefined}>
          ¡No tardes!
        </a>
      </p>
    </form>
  );
}
