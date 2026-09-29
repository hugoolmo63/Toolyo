import { generateSecret, generateURI, verify } from "otplib";

export const TOTP_PERIOD_SECONDS = 30;
export const TOTP_DIGITS = 6;

export function createTotpSecret(): string {
  return generateSecret();
}

export function createTotpUri(secret: string, label: string, issuer: string): string {
  return generateURI({ secret, label, issuer });
}

export async function verifyTotpCode(secret: string, token: string): Promise<boolean> {
  const result = await verify({ secret, token });
  return result.valid;
}