import type { OAuthProvider } from "./oauth-provider";

export const googleProvider: OAuthProvider = {
  provider: "google",
  enabled: process.env.AUTH_GOOGLE_ENABLED === "true",
  getAuthorizationUrl({ state, nonce, returnPath }) {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("nonce", nonce);
    if (returnPath) url.searchParams.set("return_path", returnPath);
    return url.toString();
  },
  async validateCallback({ code, state, expectedState }) {
    if (!code || !state || state !== expectedState) throw new Error("Invalid OAuth callback");
    throw new Error("Google token exchange requires configured server credentials");
  },
};
