import { env } from "@/env.mjs";

export interface EmailProvider {
  sendVerificationCode(input: { to: string; code: string; expiresAt: Date }): Promise<{ providerMessageId: string }>;
  sendMessageNotification(input: { to: string; conversationId: string; messageId: string; preview: string }): Promise<{ providerMessageId: string }>;
  sendKycDecisionNotification(input: { to: string; decision: string; reason: string }): Promise<{ providerMessageId: string }>;
}

export const consoleEmailProvider: EmailProvider = {
  async sendVerificationCode({ to }) {
    // Development adapter deliberately avoids logging the OTP.
    return { providerMessageId: `console-email:${to.slice(0, 2)}` };
  },
  async sendMessageNotification({ to, messageId }) {
    return { providerMessageId: `console-message:${to.slice(0, 2)}:${messageId}` };
  },
  async sendKycDecisionNotification({ to }) { return { providerMessageId: `console-kyc:${to.slice(0, 2)}` }; },
};

const resendEmailProvider: EmailProvider = {
  async sendVerificationCode({ to, code, expiresAt }) {
    if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
      throw new Error("RESEND_API_KEY y RESEND_FROM son obligatorios cuando EMAIL_PROVIDER=resend");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to,
        subject: "Tu código de verificación de Toolyo",
        text: [
          "Tu código de verificación de Toolyo es:",
          code,
          "",
          `Caduca a las ${expiresAt.toISOString()}.`,
        ].join("\n"),
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend respondió con estado ${response.status}`);
    }

    const payload = (await response.json()) as { id?: string };
    return { providerMessageId: payload.id ?? `resend-email:${to.slice(0, 2)}` };
  },
  async sendMessageNotification({ to, conversationId, messageId, preview }) {
    if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
      throw new Error("RESEND_API_KEY y RESEND_FROM son obligatorios cuando EMAIL_PROVIDER=resend");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to,
        subject: "Tienes un nuevo mensaje en Toolyo",
        text: [
          "Has recibido un nuevo mensaje en Toolyo.",
          "",
          preview,
          "",
          `Abre la conversación: /messages/${conversationId}`,
          `Referencia del mensaje: ${messageId}`,
        ].join("\n"),
      }),
    });

    if (!response.ok) throw new Error(`Resend respondió con estado ${response.status}`);
    const payload = (await response.json()) as { id?: string };
    return { providerMessageId: payload.id ?? `resend-message:${to.slice(0, 2)}:${messageId}` };
  },
  async sendKycDecisionNotification({ to, decision, reason }) {
    if (!env.RESEND_API_KEY || !env.RESEND_FROM) throw new Error("RESEND_API_KEY y RESEND_FROM son obligatorios cuando EMAIL_PROVIDER=resend");
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: env.RESEND_FROM, to, subject: "Actualización de tu verificación KYC en Toolyo", text: `Tu verificación KYC ha sido marcada como ${decision}.\nMotivo: ${reason}` }) });
    if (!response.ok) throw new Error(`Resend respondió con estado ${response.status}`);
    const payload = (await response.json()) as { id?: string };
    return { providerMessageId: payload.id ?? `resend-kyc:${to.slice(0, 2)}` };
  },
};

export function getEmailProvider(): EmailProvider {
  return env.EMAIL_PROVIDER === "resend" ? resendEmailProvider : consoleEmailProvider;
}
