import "server-only";
import { z } from "zod";
import { readQuoteSession } from "../session";
import { limitCatalog, sessionKey, TOO_MANY_REQUESTS } from "./limits";

// Shared helpers for the catalog Route Handlers used by the vehicle form.

/**
 * Only the vehicle form uses these lists, and it needs a quote session: without
 * one the request is refused (401), and each session has a rate limit (429).
 * Returns the response to send, or null to go on.
 */
export async function guardCatalogRequest(): Promise<Response | null> {
  const session = await readQuoteSession();
  if (!session) return Response.json({ error: "Primero ingresa tu placa para cotizar." }, { status: 401 });
  const limit = limitCatalog(sessionKey(session));
  if (!limit.ok) {
    return Response.json(
      { error: TOO_MANY_REQUESTS },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }
  return null;
}

export function parseQuery<T extends z.ZodType>(request: Request, schema: T): z.infer<T> | null {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const result = schema.safeParse(params);
  return result.success ? result.data : null;
}

export function badRequest() {
  return Response.json({ error: "Parámetros inválidos." }, { status: 400 });
}

/** Never forward upstream details to the browser. */
export function upstreamFailed(route: string, error: unknown) {
  console.error(`${route} failed`, error);
  return Response.json({ error: "No pudimos cargar el catálogo." }, { status: 502 });
}
