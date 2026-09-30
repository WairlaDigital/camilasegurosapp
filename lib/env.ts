import "server-only";
import { z } from "zod";

const envSchema = z.object({
  LAPOSITIVA_API_URL: z.url(),
  LAPOSITIVA_API_TOKEN: z.string().min(1),
  // Encrypts the quote session cookie (AES-256-GCM). Generate with:
  // node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET debe tener al menos 32 caracteres."),
  // Rate limits (features/quote/lib/limits.ts). Optional: the defaults suit production.
  RATE_LIMIT_START_PER_10_MIN: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_REQUOTE_PER_10_MIN: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_CATALOG_PER_MIN: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_CHECKOUT_PER_10_MIN: z.coerce.number().int().positive().default(20),
  // Public by design: the checkout page hands it to Culqi Checkout in the browser.
  NEXT_PUBLIC_CULQI_PUBLIC_KEY: z
    .string({ error: "Falta NEXT_PUBLIC_CULQI_PUBLIC_KEY (llave pública de Culqi)." })
    .regex(/^pk_(test|live)_\w+$/, "NEXT_PUBLIC_CULQI_PUBLIC_KEY debe empezar con pk_test_ o pk_live_."),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Variables de entorno inválidas (revisa .env.local):\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
