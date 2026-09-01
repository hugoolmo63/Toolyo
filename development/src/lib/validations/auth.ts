import { z } from "zod";

export const SsoProviderSchema = z.enum(["google", "apple", "facebook"]);
export const RegistrationSchema = z.object({
  email: z.string().trim().email("Introduce un email válido").max(254),
  password: z.string().min(12, "La contraseña debe tener al menos 12 caracteres").max(128),
  termsDocumentId: z.string().cuid(),
  privacyDocumentId: z.string().cuid(),
  marketingAccepted: z.boolean().optional().default(false),
});
export const RequestOtpSchema = z.object({
  channel: z.enum(["email", "phone"]),
  destination: z.string().trim().min(3).max(254),
  purpose: z.enum(["registration", "contact_verification", "credential_change", "recovery"]),
});
export const VerifyOtpSchema = z.object({ challengeId: z.string().cuid(), code: z.string().regex(/^\d{6}$/, "El código debe tener 6 dígitos") });
export const SsoStartSchema = z.object({ provider: SsoProviderSchema, returnPath: z.string().startsWith("/").optional() });
export const IdentityStartSchema = z.object({ termsVersion: z.string().min(1).max(40) });
export const LoginSchema = z.object({
  email: z.string().trim().email("Introduce un email válido").max(254),
  password: z.string().min(12, "La contraseña debe tener al menos 12 caracteres").max(128),
  rememberMe: z.boolean().optional().default(false),
  callback: z.string().startsWith("/").max(512).optional(),
});

export type RegistrationInput = z.infer<typeof RegistrationSchema>;
export type RequestOtpInput = z.infer<typeof RequestOtpSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
