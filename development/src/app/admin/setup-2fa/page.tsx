"use client";

import { useState } from "react";
import { api } from "@/lib/trpc-react";

export default function AdminTwoFactorSetupPage() {
  const [setup, setSetup] = useState<{ setupId: string; qrDataUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const start = api.admin.startTotpSetup.useMutation({ onSuccess: setSetup });
  const confirm = api.admin.confirmTotpSetup.useMutation({ onSuccess: () => setSetup(null) });
  return <section className="admin-page"><h1 className="page-title">Configurar 2FA</h1>{!setup ? <button type="button" onClick={() => start.mutate({ confirmation: "setup" })}>Generar QR</button> : <><img src={setup.qrDataUrl} alt="Código QR para configurar la autenticación" /><label htmlFor="admin-totp-code">Código de seis dígitos</label><input id="admin-totp-code" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} /><button type="button" onClick={() => confirm.mutate({ setupId: setup.setupId, code })}>Activar 2FA</button></>}</section>;
}