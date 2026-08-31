import { env } from "@/env.mjs";

export interface EmailProvider {
  sendVerificationCode(input: { to: string; code: string; expiresAt: Date }): Promise<{ providerMessageId: string }>;
}

export const consoleEmailProvider: EmailProvider = {
  async sendVerificationCode({ to }) {
    // Development adapter deliberately avoids logging the OTP.
    return { providerMessageId: `console-email:${to.slice(0, 2)}` };
  },
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
};

export function getEmailProvider(): EmailProvider {
  return env.EMAIL_PROVIDER === "resend" ? resendEmailProvider : consoleEmailProvider;
}
