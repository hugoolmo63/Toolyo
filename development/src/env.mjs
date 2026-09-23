import { z } from "zod";

const isTestOrCi = process.env.NODE_ENV === "test" || process.env.CI === "true";
const testDatabaseUrl = "postgresql://test:test@localhost:5432/test?schema=public";
const testStorageDefaults = {
  STORAGE_PUBLIC_BASE_URL: "http://localhost:3000/uploads",
  STORAGE_BUCKET: "toolyo-test",
  STORAGE_REGION: "test",
  STORAGE_ENDPOINT: "http://localhost:9000",
  STORAGE_ACCESS_KEY_ID: "test-access-key",
  STORAGE_SECRET_ACCESS_KEY: "test-secret-key",
};

/**
 * Validación de variables de entorno al arranque.
 * Si falta una variable crítica, la aplicación NO arranca (BACKEND.md §10.4).
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria. Cópiala desde .env.example."),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  AUTH_SECRET: z.string().min(16).optional(),
  AUTH_URL: z.string().url().optional(),
  AUTH_GOOGLE_ENABLED: z.coerce.boolean().default(false),
  AUTH_APPLE_ENABLED: z.coerce.boolean().default(false),
  AUTH_FACEBOOK_ENABLED: z.coerce.boolean().default(false),
  EMAIL_PROVIDER: z.enum(["console", "resend"]).default("console"),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
  SMS_PROVIDER: z.enum(["console", "twilio"]).default("console"),
  SMS_OTP_ENABLED: z.coerce.boolean().default(false),
  KYC_PROVIDER: z.enum(["disabled", "external"]).default("disabled"),
  OTP_SECRET: z.string().min(16).optional(),
  RATE_LIMIT_STORE: z.enum(["memory", "redis"]).default("memory"),
  SESSION_COOKIE_NAME: z.string().min(1).default("toolyo_session"),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  SESSION_REMEMBER_TTL_SECONDS: z.coerce.number().int().positive().default(2592000),
  // Búsqueda pública (004-public-search)
  MAP_TILES_URL: z
    .string()
    .url()
    .default("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
  GEOCODING_PROVIDER: z.enum(["nominatim"]).default("nominatim"),
  GEOCODING_BASE_URL: z
    .string()
    .url()
    .default("https://nominatim.openstreetmap.org"),
  SEARCH_RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(100),
  SUGGEST_RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(60),
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  STORAGE_PUBLIC_BASE_URL: z.string().url(),
  STORAGE_BUCKET: z.string().min(1),
  STORAGE_REGION: z.string().min(1),
  STORAGE_ENDPOINT: z.string().url(),
  STORAGE_ACCESS_KEY_ID: z.string().min(1),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
  STORAGE_PRESIGNED_TTL_SECONDS: z.coerce.number().int().positive().max(900).default(300),
});

const parsed = envSchema.safeParse({
  ...process.env,
  ...(isTestOrCi ? {
    DATABASE_URL: process.env.DATABASE_URL ?? testDatabaseUrl,
    ...Object.fromEntries(Object.entries(testStorageDefaults).map(([key, value]) => [key, process.env[key] ?? value])),
  } : {}),
});

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment variables:\n  " + missing.join("\n  "));
  process.exit(1);
}

export const env = parsed.data;