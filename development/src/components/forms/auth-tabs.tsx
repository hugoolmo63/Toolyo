"use client";

import { useSearchParams } from "next/navigation";
import { LoginForm } from "./login-form";
import { RegistrationForm } from "./registration-form";
import type { LegalRegistrationDocument } from "@/types/auth";

const ART_CONTENT = {
  login: {
    label: "INICIO DE SESIÓN / 01",
    title: "Menos compra.\nMás posibilidad.",
    number: "01",
  },
  register: {
    label: "CREAR CUENTA / 01",
    title: "Alquila con\nconfianza.",
    number: "01",
  },
} as const;

export function AuthTabs({ legalDocuments }: { legalDocuments: LegalRegistrationDocument[] }) {
  const searchParams = useSearchParams();
  const isRegister = searchParams.get("tab") === "register";
  const art = isRegister ? ART_CONTENT.register : ART_CONTENT.login;

  return (
    <main className="auth-page">
      <div className="auth-art" aria-hidden="true">
        <span>{art.label}</span>
        <strong>{art.title}</strong>
        <i>{art.number}</i>
      </div>
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-form">
          {isRegister ? (
            <RegistrationForm legalDocuments={legalDocuments} />
          ) : (
            <LoginForm />
          )}
        </div>
      </section>
    </main>
  );
}
