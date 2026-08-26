export interface SmsProvider {
  sendVerificationCode(input: { toE164: string; code: string; expiresAt: Date }): Promise<{ providerMessageId: string }>;
}

export const consoleSmsProvider: SmsProvider = {
  async sendVerificationCode({ toE164 }) {
    // Development adapter deliberately avoids logging the OTP.
    return { providerMessageId: `console-sms:${toE164.slice(-2)}` };
  },
};
