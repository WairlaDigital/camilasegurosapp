"use server";

import { redirect } from "next/navigation";
import { formatMoney } from "@/lib/money";
import type { PlanSummary } from "@/types/quote";
import { queryInfo } from "@/services/quotes";
import { formatDate, todayInLima } from "./lib/dates";
import { limitRequote, sessionKey, TOO_MANY_REQUESTS } from "./lib/limits";
import { DOCUMENT_TYPES } from "./lib/vehicle-rules";
import { planSummaries } from "./lib/plans";
import { parseQuoteForm, startDateError, type QuoteFieldErrors } from "./quote-schema";
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

export type RequoteResult =
  | { ok: true; startDate: string; plans: PlanSummary[]; message: string }
  | { ok: false; error: string };

/**
 * Another start date on the quote screen: a new quote right away (the quote
 * token and maybe the price depend on it), so the card shows the price for that
 * date before paying. The price always comes from the API.
 */
export async function requoteForDate(startDate: string): Promise<RequoteResult> {
  const session = await readQuoteSession();
  if (!session) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar tu placa para cotizar." };
  const invalid = startDateError(startDate, todayInLima());
  if (invalid) return { ok: false, error: invalid };

  const { request, result, selection } = session;
  const chosen = (plans: { id: number; priceCents: number }[]) =>
    plans.find((plan) => plan.id === selection?.planId) ?? plans[0];
  const before = chosen(result.plans);
  if (startDate === request.startDate) {
    return { ok: true, startDate, plans: planSummaries(result), message: "" };
  }

  if (!limitRequote(sessionKey(session)).ok) return { ok: false, error: TOO_MANY_REQUESTS };
  let requoted;
  try {
    requoted = await requote(session, startDate);
  } catch (error) {
    console.error("requoteForDate: /query-info failed", error);
    return { ok: false, error: "No pudimos cotizar para esa fecha. Inténtalo de nuevo en unos minutos." };
  }
  const after = chosen(requoted.plans);
  if (!requoted.vehicle || !after) {
    return { ok: false, error: "No tenemos un SOAT disponible para esa fecha. Prueba con otra fecha." };
  }

  // Same as saveVehicle: the session keeps the vehicle as the user confirmed it.
  await writeQuoteSession({
    ...session,
    request: { ...request, startDate },
    result: { ...requoted, vehicle: result.vehicle },
    selection: selection && requoted.plans.some((plan) => plan.id === selection.planId) ? selection : undefined,
  });

  const date = formatDate(startDate);
  const message =
    before && after.priceCents !== before.priceCents
      ? `El precio cambió: para el ${date} es ${formatMoney(after.priceCents)}.`
      : `Cotizamos tu SOAT para el ${date}: ${formatMoney(after.priceCents)}.`;
  return { ok: true, startDate, plans: planSummaries(requoted), message };
}

/**
 * "Ir a pagar" (step 3/3): validates the plan and start date. The date is quoted
 * as soon as it changes (`requoteForDate`); if it still differs from the quoted
 * one (e.g. the page was submitted before that finished), it is quoted here.
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
  const { planId, startDate } = parsed.data;

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

  await writeQuoteSession({ ...session, request, result, selection: { planId } });
  redirect("/cotizar/antes-de-pagar");
}
