import { z } from "zod";

/**
 * Validación de variables de entorno al arranque.
 * Si falta una variable crítica, la aplicación NO arranca (BACKEND.md §10.4).
 */
const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL es obligatoria. Cópiala desde .env.example."),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  AUTH_SECRET: z.string().min(16).optional(),
  AUTH_URL: z.string().url().optional(),
  AUTH_GOOGLE_ENABLED: z.coerce.boolean().default(false),
  AUTH_APPLE_ENABLED: z.coerce.boolean().default(false),
  AUTH_FACEBOOK_ENABLED: z.coerce.boolean().default(false),
  EMAIL_PROVIDER: z.enum(["console", "resend"]).default("console"),
  SMS_PROVIDER: z.enum(["console", "twilio"]).default("console"),
  KYC_PROVIDER: z.enum(["disabled", "external"]).default("disabled"),
  OTP_SECRET: z.string().min(16).optional(),
  RATE_LIMIT_STORE: z.enum(["memory", "redis"]).default("memory"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment variables:\n  " + missing.join("\n  "));
  process.exit(1);
}

export const env = parsed.data;