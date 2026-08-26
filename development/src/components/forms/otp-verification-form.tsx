"use client";

import { useState } from "react";

export function OtpVerificationForm({ channel = "email" }: { channel?: "email" | "phone" }) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("Te hemos enviado un código de 6 dígitos.");

  function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(code.length === 6 ? "Código recibido. La verificación se completará al conectar el servicio." : "Introduce los 6 dígitos del código.");
  }

  return <form className="auth-form" onSubmit={verify} noValidate><label htmlFor="otp-code">Código de {channel === "email" ? "email" : "SMS"}</label><input id="otp-code" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} aria-describedby="otp-message" /><p id="otp-message" className="field-hint" aria-live="polite">{message}</p><button className="auth-submit" type="submit">Verificar código</button><button className="text-button" type="button" onClick={() => setMessage("Hemos preparado un nuevo envío. Revisa tu bandeja o teléfono.")}>Reenviar código</button></form>;
}
