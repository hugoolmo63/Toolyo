"use client";

import { useState } from "react";
import Image from "next/image";
import { api } from "@/lib/trpc-react";

type TotpSetup = {
  setupId: string;
  qrDataUrl: string;
};

export default function AdminTwoFactorSetupPage() {
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [code, setCode] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const start = api.admin.startTotpSetup.useMutation({
    onSuccess: (data) => {
      setSuccessMessage(null);
      setSetup(data);
      setCode("");
    },
  });
  const confirm = api.admin.confirmTotpSetup.useMutation({
    onSuccess: () => {
      setSetup(null);
      setCode("");
      setSuccessMessage("La autenticación de dos factores se ha activado correctamente.");
    },
  });

  const errorMessage = start.error?.message ?? confirm.error?.message;
  const isLoading = start.isPending || confirm.isPending;

  return (
    <section className="admin-page" aria-labelledby="setup-2fa-title">
      <div className="page-header">
        <div>
          <p className="form-kicker">Seguridad de la cuenta</p>
          <h1 id="setup-2fa-title" className="page-title">Configurar 2FA</h1>
          <p className="page-subtitle">
            Añade una capa adicional de seguridad usando una aplicación de autenticación.
          </p>
        </div>
      </div>

      <div className="form-card">
        {successMessage && (
          <div className="alert alert-success" role="status" aria-live="polite">
            <p>{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger" role="alert" aria-live="assertive">
            <p>{errorMessage}</p>
          </div>
        )}

        {!setup ? (
          <>
            <p>
              Genera un código QR y escanéalo con tu aplicación de autenticación para comenzar.
            </p>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => start.mutate({ confirmation: "setup" })}
                disabled={isLoading}
              >
                {start.isPending ? "Generando QR…" : "Generar QR"}
              </button>
            </div>
          </>
        ) : (
          <div className="admin-totp-setup">
            <p>Escanea este código QR con tu aplicación de autenticación.</p>
            <Image
              src={setup.qrDataUrl}
              alt="Código QR para configurar la autenticación de dos factores"
              width={256}
              height={256}
              unoptimized
            />

            <label className="field" htmlFor="admin-totp-code">
              Código de seis dígitos
              <input
                id="admin-totp-code"
                className="input"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                disabled={confirm.isPending}
                aria-describedby="admin-totp-code-help"
              />
            </label>
            <p id="admin-totp-code-help" className="page-subtitle">
              Introduce el código que muestra tu aplicación para confirmar la configuración.
            </p>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => confirm.mutate({ setupId: setup.setupId, code })}
                disabled={confirm.isPending || code.length !== 6}
              >
                {confirm.isPending ? "Activando 2FA…" : "Activar 2FA"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setSetup(null);
                  setCode("");
                  confirm.reset();
                }}
                disabled={confirm.isPending}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}