"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "@/components/forms/login-form";
import { OtpVerificationForm } from "@/components/forms/otp-verification-form";
import { RegistrationForm } from "@/components/forms/registration-form";
import { api } from "@/lib/trpc-react";
import type { LegalRegistrationDocument } from "@/types/auth";
import { Modal } from "@/components/ui";

interface LoginDialogProps {
  open: boolean;
  onClose(): void;
  tab: "login" | "register";
  onTabChange(tab: "login" | "register"): void;
}

/**
 * Diálogo de login contextual (007-login-contextual).
 * Usa <dialog> nativo con showModal(): focus trap, cierre con Escape y
 * top-layer sin lógica adicional (FR-013, FRONTEND.md §8).
 */
export function LoginDialog({ open, onClose, tab, onTabChange }: LoginDialogProps) {
  const legalDocumentsQuery = api.auth.getRegistrationLegalDocuments.useQuery(undefined, {
    enabled: open && tab === "register",
  });
  const [pendingVerification, setPendingVerification] = useState<{ email: string; challengeId: string } | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState("");

  useEffect(() => {
    if (!open) {
      setPendingVerification(null);
      setVerifiedEmail("");
    }
  }, [open]);

  const legalDocuments = legalDocumentsQuery.data as LegalRegistrationDocument[] | undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Autenticación de Toolyo"
      className="login-dialog"
      closeLabel="Cerrar diálogo de autenticación"
    >
      {pendingVerification ? (
        <>
          <p className="auth-success" role="status" aria-live="polite">
            ¡Cuenta creada correctamente! Verifica tu email para continuar.
          </p>
          <div className="form-intro">
            <p className="form-kicker">Verifica tu email</p>
            <h1>Un último paso.</h1>
            <p>Confirma tu dirección de correo para terminar de crear la cuenta.</p>
          </div>
          <OtpVerificationForm
            channel="email"
            destination={pendingVerification.email}
            initialChallengeId={pendingVerification.challengeId}
            onVerified={() => {
              setVerifiedEmail(pendingVerification.email);
              setPendingVerification(null);
              onTabChange("login");
            }}
          />
        </>
      ) : tab === "register" ? (
        legalDocumentsQuery.isError ? (
          <p className="form-error" role="alert">No se pudo cargar el formulario. Inténtalo de nuevo.</p>
        ) : legalDocumentsQuery.isLoading || !legalDocuments ? (
          <p className="field-hint" role="status">Cargando el formulario de registro...</p>
        ) : (
          <RegistrationForm
            legalDocuments={legalDocuments}
            variant="dialog"
            onRegistered={(email, challengeId) => setPendingVerification({ email, challengeId })}
            onNavigateLogin={() => onTabChange("login")}
          />
        )
      ) : (
        <>
          {verifiedEmail && (
            <p className="auth-success" role="status" aria-live="polite">
              Cuenta creada correctamente y email verificado. Introduce tu contraseña para iniciar sesión.
            </p>
          )}
          <LoginForm
            key={verifiedEmail || "login"}
            variant="dialog"
            onSuccess={onClose}
            onNavigateRegister={() => onTabChange("register")}
            initialEmail={verifiedEmail}
          />
        </>
      )}
    </Modal>
  );
}
