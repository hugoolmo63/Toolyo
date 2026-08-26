export interface EmailProvider {
  sendVerificationCode(input: { to: string; code: string; expiresAt: Date }): Promise<{ providerMessageId: string }>;
}

export const consoleEmailProvider: EmailProvider = {
  async sendVerificationCode({ to }) {
    // Development adapter deliberately avoids logging the OTP.
    return { providerMessageId: `console-email:${to.slice(0, 2)}` };
  },
};
