import "server-only";
import { z } from "zod";
import { env } from "@/lib/env";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION"
  | "UNAVAILABLE"
  | "INVALID_RESPONSE"
  | "NETWORK";

/**
 * Error returned by every service. `message` is for logs only: the UI maps
 * `code` (and `fieldErrors` for forms) to its own copy.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: ApiErrorCode,
    readonly status?: number,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  searchParams?: Record<string, string | number | undefined>;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;

// Laravel sends 422 as { message, errors: { field: string[] } }.
const validationErrorSchema = z.object({
  errors: z.record(z.string(), z.array(z.string())),
});

function buildUrl(path: string, searchParams?: RequestOptions["searchParams"]) {
  const url = new URL(`${env.LAPOSITIVA_API_URL.replace(/\/$/, "")}${path}`);
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url;
}

function codeFromStatus(status: number): ApiErrorCode {
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 404) return "NOT_FOUND";
  if (status === 422) return "VALIDATION";
  return "UNAVAILABLE";
}

/**
 * Single entry point to the app-soat-taxi API. Every response is validated
 * with `schema`, so callers only ever receive data matching the contract.
 */
export async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  { method = "GET", body, searchParams, timeoutMs = DEFAULT_TIMEOUT_MS }: RequestOptions = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, searchParams), {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${env.LAPOSITIVA_API_TOKEN}`,
        ...(body !== undefined && { "Content-Type": "application/json" }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (cause) {
    throw new ApiError(`${method} ${path} failed: ${String(cause)}`, "NETWORK");
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    // Never forward the raw body: in debug mode it includes stack traces and server paths.
    const fieldErrors =
      response.status === 422 ? validationErrorSchema.safeParse(payload).data?.errors : undefined;
    throw new ApiError(
      `${method} ${path} responded ${response.status}`,
      codeFromStatus(response.status),
      response.status,
      fieldErrors,
    );
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new ApiError(
      `${method} ${path} returned an unexpected shape: ${result.error.message}`,
      "INVALID_RESPONSE",
      response.status,
    );
  }
  return result.data;
}
