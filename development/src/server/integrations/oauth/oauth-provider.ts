import type { SsoProvider } from "@/types/auth";

export interface OAuthIdentity {
  provider: SsoProvider;
  providerAccountId: string;
  email?: string;
}

export interface OAuthProvider {
  provider: SsoProvider;
  enabled: boolean;
  getAuthorizationUrl(input: { state: string; nonce: string; returnPath?: string }): string;
  validateCallback(input: { code: string; state: string; expectedState: string; nonce: string }): Promise<OAuthIdentity>;
}
