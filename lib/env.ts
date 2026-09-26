import "server-only";
import { z } from "zod";

const envSchema = z.object({
  LAPOSITIVA_API_URL: z.url(),
  LAPOSITIVA_API_TOKEN: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Variables de entorno inválidas (revisa .env.local):\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
