import "server-only";
import { createHash } from "node:crypto";
import { env } from "@/lib/env";
import { createRateLimiter } from "@/lib/rate-limit";
import type { QuoteSession } from "../session";

// Every limited call spends our API token and, for quotes, runs the plate and
// RENIEC/SUNAT lookups in the backend. Counts live in memory (lib/rate-limit.ts).

const MINUTE = 60_000;

export const TOO_MANY_REQUESTS = "Hiciste muchas consultas seguidas. Espera unos minutos e inténtalo de nuevo.";

/** Home form, before there is a session: per IP, generous because mobile carriers share IPs (CGNAT). */
export const limitStartQuote = createRateLimiter({
  name: "start-quote",
  limit: env.RATE_LIMIT_START_PER_10_MIN,
  windowMs: 10 * MINUTE,
});

/** New quotes inside the flow (vehicle form, another start date): per quote session. */
export const limitRequote = createRateLimiter({
  name: "requote",
  limit: env.RATE_LIMIT_REQUOTE_PER_10_MIN,
  windowMs: 10 * MINUTE,
});

/** Catalog lists of the vehicle form (/api/vehicles/*): per quote session. */
export const limitCatalog = createRateLimiter({
  name: "catalog",
  limit: env.RATE_LIMIT_CATALOG_PER_MIN,
  windowMs: MINUTE,
});

/** Who a quote session belongs to, without keeping the document number in memory. */
export function sessionKey(session: QuoteSession): string {
  const { documentType, documentNumber, plate } = session.input;
  return createHash("sha256").update(`${documentType}:${documentNumber}:${plate}`).digest("base64url");
}
