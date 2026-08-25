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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment variables:\n  " + missing.join("\n  "));
  process.exit(1);
}

export const env = parsed.data;