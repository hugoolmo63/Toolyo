"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginSchema, type LoginInput } from "@/lib/validations/auth";
import { api } from "@/lib/trpc-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callback = searchParams.get("callback") ?? "/dashboard";

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "", rememberMe: false, callback },
  });

  const loginMutation = api.auth.loginWithPassword.useMutation({
    onSuccess: (data) => {
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
        <h1>Inicia sesión.</h1>
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
        <a href="/auth?tab=register">¡No tardes!</a>
      </p>
    </form>
  );
}
