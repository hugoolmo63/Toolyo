import type { OAuthProvider } from "./oauth-provider";
import { googleProvider } from "./google.provider";

export const oauthProviders: Record<string, OAuthProvider | undefined> = { google: googleProvider };

export function getEnabledOAuthProvider(provider: string): OAuthProvider {
  const selected = oauthProviders[provider];
  if (!selected?.enabled) throw new Error("OAuth provider is not enabled");
  return selected;
}
