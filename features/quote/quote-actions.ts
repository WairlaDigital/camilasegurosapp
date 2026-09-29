"use server";

import { redirect } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { queryInfo } from "@/services/quotes";
import { formatDate, todayInLima } from "./lib/dates";
import { limitRequote, sessionKey, TOO_MANY_REQUESTS } from "./lib/limits";
import { DOCUMENT_TYPES } from "./lib/vehicle-rules";
import { parseQuoteForm, type QuoteFieldErrors } from "./quote-schema";
import { readQuoteSession, writeQuoteSession, type QuoteSession } from "./session";

export type ConfirmQuoteState =
  | { status: "idle" }
  | { status: "invalid"; errors: QuoteFieldErrors }
  | { status: "failed"; message: string }
  /** The new start date changed the price: the page shows it and the user confirms again. */
  | { status: "repriced"; message: string };

/** Quotes again for another start date (the quote token is tied to it). */
async function requote(session: QuoteSession, startDate: string) {
  const { input, request } = session;
  return queryInfo({
    documentType: DOCUMENT_TYPES[input.documentType].apiId,
    documentNumber: input.documentNumber,
    plate: input.plate,
    typeId: request.typeId,
    useId: request.useId,
    ubigeoId: request.ubigeoId,
    startDate,
    manual: request.manual,
  });
}

/**
 * "Ir a pagar": validates the plan, start date and phone. A start date other
 * than the quoted one means a new quote (new token and maybe a new price), made
 * here once instead of on every date change. The price always comes from the API.
 */
export async function confirmQuote(_prev: ConfirmQuoteState, formData: FormData): Promise<ConfirmQuoteState> {
  const session = await readQuoteSession();
  if (!session) {
    return { status: "failed", message: "Tu sesión expiró. Vuelve a ingresar tu placa para cotizar." };
  }

  const parsed = parseQuoteForm(Object.fromEntries(formData), {
    today: todayInLima(),
    planIds: session.result.plans.map((plan) => plan.id),
  });
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors };
  const { planId, startDate, phone } = parsed.data;

  let { request, result } = session;

  if (startDate !== request.startDate) {
    if (!limitRequote(sessionKey(session)).ok) return { status: "failed", message: TOO_MANY_REQUESTS };
    let requoted;
    try {
      requoted = await requote(session, startDate);
    } catch (error) {
      console.error("confirmQuote: /query-info failed", error);
      return { status: "failed", message: "No pudimos cotizar para esa fecha. Inténtalo de nuevo en unos minutos." };
    }

    const before = result.plans.find((plan) => plan.id === planId);
    const after = requoted.plans.find((plan) => plan.id === planId);
    if (!requoted.vehicle || !before || !after) {
      return { status: "failed", message: "Tu plan no está disponible para esa fecha. Prueba con otra fecha." };
    }

    // Same as saveVehicle: the session keeps the vehicle as the user confirmed it.
    request = { ...request, startDate };
    result = { ...requoted, vehicle: result.vehicle };

    if (after.priceCents !== before.priceCents) {
      await writeQuoteSession({ ...session, request, result, selection: undefined });
      return {
        status: "repriced",
        message: `Para el ${formatDate(startDate)} el precio es ${formatMoney(after.priceCents)}. Revísalo y presiona «Ir a pagar» para continuar.`,
      };
    }
  }

  await writeQuoteSession({ ...session, request, result, selection: { planId, phone } });
  redirect("/cotizar/titular");
}
