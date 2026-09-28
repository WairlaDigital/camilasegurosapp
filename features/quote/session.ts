import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { env } from "@/lib/env";
import { DOCUMENT_TYPE_KEYS, VEHICLE_USE_KEYS } from "./lib/vehicle-rules";

// Quote state shared by the flow screens. It holds personal data (document,
// email), so it is encrypted (AES-256-GCM), httpOnly and short-lived. Keeping it
// avoids repeating POST /query-info, which creates a new quote on every call.

const COOKIE_NAME = "cs_quote";
const MAX_AGE_SECONDS = 60 * 60 * 2;

const option = <T extends z.ZodType>(id: T) => z.object({ id, name: z.string() });

const sessionSchema = z.object({
  input: z.object({
    plate: z.string(),
    documentType: z.enum(DOCUMENT_TYPE_KEYS),
    documentNumber: z.string(),
    use: z.enum(VEHICLE_USE_KEYS),
    email: z.string(),
  }),
  // Everything needed to repeat POST /query-info (e.g. with another start date).
  request: z.object({
    typeId: z.number(),
    useId: z.number(),
    ubigeoId: z.string(),
    startDate: z.string(), // YYYY-MM-DD the current prices were quoted for
    manual: z
      .object({
        brandId: z.number(),
        modelId: z.string(),
        versionId: z.string(),
        seats: z.number(),
        year: z.number(),
        serial: z.string(),
        vin: z.string(),
      })
      .optional(),
  }),
  result: z.object({
    vehicle: z
      .object({
        plate: z.string(),
        typeId: z.number(),
        useId: z.number(),
        brand: option(z.number()).optional(),
        model: option(z.string()).optional(),
        version: option(z.string()).optional(),
        year: z.number().optional(),
        seats: z.number().optional(),
        serial: z.string().optional(),
        vin: z.string().optional(),
        registeredCategory: z.enum(["auto", "moto"]).optional(),
      })
      .nullable(),
    holder: z
      .object({ firstName: z.string().optional(), lastName: z.string().optional(), companyName: z.string().optional() })
      .nullable(),
    plans: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        product: z.string(),
        insurer: z.string(),
        priceCents: z.number(),
        quoteToken: z.string().nullable(),
        features: z.array(z.object({ name: z.string(), included: z.boolean() })),
      }),
    ),
    featuredPlanId: z.number().nullable(),
  }),
  /** Set by "Ir a pagar" on the quote screen; the price comes from `result`, never from here. */
  selection: z.object({ planId: z.number(), phone: z.string() }).optional(),
});

export type QuoteSession = z.infer<typeof sessionSchema>;

const key = createHash("sha256").update(env.SESSION_SECRET).digest();

function encrypt(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}

function decrypt(token: string): string | null {
  try {
    const raw = Buffer.from(token, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
  } catch {
    return null; // tampered, expired secret or corrupted cookie
  }
}

export async function readQuoteSession(): Promise<QuoteSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const json = token ? decrypt(token) : null;
  if (!json) return null;
  try {
    const result = sessionSchema.safeParse(JSON.parse(json));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** Only callable from Server Actions or Route Handlers (cookies are read-only while rendering). */
export async function writeQuoteSession(session: QuoteSession): Promise<void> {
  (await cookies()).set(COOKIE_NAME, encrypt(JSON.stringify(session)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}
