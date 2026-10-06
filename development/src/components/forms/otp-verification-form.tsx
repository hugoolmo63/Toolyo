"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/trpc-react";

export function OtpVerificationForm({ channel = "email", destination = "", initialChallengeId = "", onVerified }: { channel?: "email" | "phone"; destination?: string; initialChallengeId?: string; onVerified?: () => void }) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("Te hemos enviado un código de 6 dígitos.");
  const [challengeId, setChallengeId] = useState(initialChallengeId);
  const autoRequestedRef = useRef(false);

  const requestOtpMutation = api.auth.requestOtp.useMutation({
    onSuccess: (data) => {
      setChallengeId(data.challengeId);
      setMessage(data.retryAfterSeconds > 0 ? `Has hecho demasiadas solicitudes. Inténtalo de nuevo en ${data.retryAfterSeconds} segundos.` : `Te hemos enviado un código de 6 dígitos a ${destination}.`);
    },
    onError: (error) => {
      setMessage(error.message || "No se ha podido enviar el código en este momento.");
    },
  });
  const requestOtp = requestOtpMutation.mutate;

  const verifyOtpMutation = api.auth.verifyOtp.useMutation({
    onSuccess: (result) => {
      if (result.ok) {
        setMessage("Código verificado correctamente.");
        onVerified?.();
      } else {
        setMessage("El código no es válido o ha caducado. Solicita uno nuevo.");
      }
    },
    onError: (error) => {
      setMessage(error.message || "No se ha podido verificar el código.");
    },
  });

  useEffect(() => {
    if (!challengeId && destination && !autoRequestedRef.current) {
      autoRequestedRef.current = true;
      requestOtp({ channel, destination, purpose: "registration" });
    }
  }, [challengeId, channel, destination, requestOtp]);

  function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challengeId) {
      setMessage("Todavía no hemos generado un código para esta cuenta.");
      return;
    }

    if (code.length !== 6) {
      setMessage("Introduce los 6 dígitos del código.");
      return;
    }

    verifyOtpMutation.mutate({ challengeId, code });
  }

  return <form className="auth-form" onSubmit={verify} noValidate><label htmlFor="otp-code">Código de {channel === "email" ? "email" : "SMS"}</label><input id="otp-code" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} aria-describedby="otp-message" /><p id="otp-message" className="field-hint" aria-live="polite">{message}</p><button className="auth-submit" type="submit" disabled={verifyOtpMutation.isPending}>{verifyOtpMutation.isPending ? "Verificando..." : "Verificar código"}</button><button className="text-button" type="button" onClick={() => { if (!destination) { setMessage("Necesitamos tu email para reenviar el código."); return; } requestOtpMutation.mutate({ channel, destination, purpose: "registration" }); }} disabled={requestOtpMutation.isPending}>{requestOtpMutation.isPending ? "Reenviando..." : "Reenviar código"}</button></form>;
}
