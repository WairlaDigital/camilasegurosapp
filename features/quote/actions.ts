"use server";

import { parseStartQuote, type FieldErrors } from "./schema";

export type StartQuoteState =
  | { status: "idle" }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "ready" };

/**
 * Home form submit. Always re-validates on the server.
 *
 * TODO(next screen): look up the plate and quote (POST /query-info), keep the
 * quote in a signed httpOnly cookie and redirect to the next step. The flow
 * steps are still pending (see PENDIENTES.md).
 */
export async function startQuote(_prev: StartQuoteState, formData: FormData): Promise<StartQuoteState> {
  const result = parseStartQuote(Object.fromEntries(formData));
  if (!result.ok) return { status: "invalid", errors: result.errors };
  return { status: "ready" };
}
