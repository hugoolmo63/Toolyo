import type { IdentityVerificationStatus } from "@/types/auth";

export interface KycProvider {
  createSession(input: { userId: string; reference: string }): Promise<{ providerReference: string; redirectUrl: string }>;
  verifyWebhook(payload: string, signature: string): { providerEventId: string; providerReference: string; status: IdentityVerificationStatus; resultCode?: string };
}

export const disabledKycProvider: KycProvider = {
  async createSession() {
    throw new Error("KYC provider is not configured");
  },
  verifyWebhook() {
    throw new Error("KYC provider is not configured");
  },
};
