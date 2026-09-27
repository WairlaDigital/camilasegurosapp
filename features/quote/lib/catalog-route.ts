import "server-only";
import { z } from "zod";

// Shared helpers for the catalog Route Handlers used by the vehicle form.

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
