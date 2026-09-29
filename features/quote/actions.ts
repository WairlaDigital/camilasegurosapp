"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientIp } from "@/lib/rate-limit";
import { ApiError } from "@/services/errors";
import { getVehicleTypes } from "@/services/catalog";
import { isVehicleComplete, lookupPlate, queryInfo } from "@/services/quotes";
import { todayInLima } from "./lib/dates";
import { limitStartQuote, TOO_MANY_REQUESTS } from "./lib/limits";
import { detectCategory } from "./lib/plate";
import { CATEGORY_MISMATCH, NOT_ONLINE, quoteRequestFor } from "./lib/quote-request";
import { DEFAULT_UBIGEO_ID, DOCUMENT_TYPES, defaultQuoteRequest } from "./lib/vehicle-rules";
import { parseStartQuote, type FieldErrors } from "./schema";
import { writeQuoteSession } from "./session";

export type StartQuoteState =
  | { status: "idle" }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "failed"; message: string };

const UNAVAILABLE = "No pudimos consultar tu placa en este momento. Inténtalo de nuevo en unos minutos.";

/**
 * Home form submit: validates, looks up the vehicle registration (POST
 * /query-plate, no quote) to quote with the real vehicle type, quotes once
 * (POST /query-info), keeps the result in the quote session and moves on.
 */
export async function startQuote(_prev: StartQuoteState, formData: FormData): Promise<StartQuoteState> {
  const parsed = parseStartQuote(Object.fromEntries(formData));
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors };
  const input = parsed.data;

  const category = detectCategory(input.plate);
  if (!category || !defaultQuoteRequest(category, input.use)) return { status: "failed", message: NOT_ONLINE };

  if (!limitStartQuote(clientIp(await headers())).ok) return { status: "failed", message: TOO_MANY_REQUESTS };

  // Without the registration or the catalog, the category's default type is used
  // (and the vehicle data form lets the person fix it): never block the quote on them.
  const [registration, types] = await Promise.all([
    lookupPlate(input.plate).catch((error: unknown) => {
      console.error("startQuote: /query-plate failed", error);
      return null;
    }),
    getVehicleTypes().catch((error: unknown) => {
      console.error("startQuote: /data failed", error);
      return [];
    }),
  ]);

  const resolved = quoteRequestFor({
    category,
    use: input.use,
    documentType: input.documentType,
    registration,
    types,
  });
  if (!resolved.ok) {
    return resolved.field === "use"
      ? { status: "invalid", errors: { use: resolved.message } }
      : { status: "failed", message: resolved.message };
  }
  const request = { typeId: resolved.typeId, useId: resolved.useId };

  const startDate = todayInLima();
  let result;
  try {
    result = await queryInfo({
      documentType: DOCUMENT_TYPES[input.documentType].apiId,
      documentNumber: input.documentNumber,
      plate: input.plate,
      ubigeoId: DEFAULT_UBIGEO_ID,
      startDate,
      ...request,
    });
  } catch (error) {
    if (error instanceof ApiError && error.code === "VALIDATION") {
      const errors: FieldErrors = {};
      if (error.fieldErrors?.plate) errors.plate = "Revisa tu placa: no tiene un formato válido.";
      if (error.fieldErrors?.document_number) errors.documentNumber = "Revisa tu número de documento.";
      if (Object.keys(errors).length > 0) return { status: "invalid", errors };
    }
    console.error("startQuote: /query-info failed", error);
    return { status: "failed", message: UNAVAILABLE };
  }

  // Spec 4.1 again, for when /query-plate failed but /query-info got the registration.
  const registered = result.vehicle?.registeredCategory;
  if (registered && registered !== category) {
    return { status: "failed", message: CATEGORY_MISMATCH[category] };
  }

  await writeQuoteSession({ input, request: { ...request, ubigeoId: DEFAULT_UBIGEO_ID, startDate }, result });

  redirect(isVehicleComplete(result.vehicle) ? "/cotizar/cotizacion" : "/cotizar/datos-incompletos");
}
