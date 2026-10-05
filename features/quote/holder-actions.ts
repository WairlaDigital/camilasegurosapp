"use server";

import { redirect } from "next/navigation";
import { lockedHolderFields, parseHolderForm, type HolderFieldErrors } from "./holder-schema";
import { readQuoteSession, writeQuoteSession } from "./session";

export type SaveHolderState =
  | { status: "idle" }
  | { status: "invalid"; errors: HolderFieldErrors }
  | { status: "failed"; message: string };

/**
 * "Completa los datos del titular" (step 1/3): keeps what the order needs (POST
 * /data) in the session. No API call: the order is created when the person pays.
 */
export async function saveHolder(_prev: SaveHolderState, formData: FormData): Promise<SaveHolderState> {
  const session = await readQuoteSession();
  if (!session) {
    return { status: "failed", message: "Tu sesión expiró. Vuelve a ingresar tu placa para cotizar." };
  }

  const parsed = parseHolderForm(Object.fromEntries(formData), lockedHolderFields(session.result.holder));
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors };

  await writeQuoteSession({ ...session, holderDetails: parsed.data });
  redirect("/cotizar/vehiculo");
}
