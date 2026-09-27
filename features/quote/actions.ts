"use server";

import { redirect } from "next/navigation";
import { ApiError } from "@/services/errors";
import { isVehicleComplete, queryInfo } from "@/services/quotes";
import { todayInLima } from "./lib/dates";
import { detectCategory } from "./lib/plate";
import { DEFAULT_UBIGEO_ID, DOCUMENT_TYPES, defaultQuoteRequest } from "./lib/vehicle-rules";
import { parseStartQuote, type FieldErrors } from "./schema";
import { writeQuoteSession } from "./session";

export type StartQuoteState =
  | { status: "idle" }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "failed"; message: string };

const UNAVAILABLE = "No pudimos consultar tu placa en este momento. Inténtalo de nuevo en unos minutos.";

/**
 * Home form submit: validates, looks up the plate and quotes (POST /query-info),
 * keeps the result in the quote session and moves to the next step.
 */
export async function startQuote(_prev: StartQuoteState, formData: FormData): Promise<StartQuoteState> {
  const parsed = parseStartQuote(Object.fromEntries(formData));
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors };
  const input = parsed.data;

  const category = detectCategory(input.plate);
  const request = category ? defaultQuoteRequest(category, input.use) : null;
  if (!request) {
    return {
      status: "failed",
      message: "Por ahora no podemos cotizar en línea este tipo de uso. Escríbenos y te ayudamos.",
    };
  }

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

  await writeQuoteSession({ input, request: { ...request, ubigeoId: DEFAULT_UBIGEO_ID, startDate }, result });

  redirect(isVehicleComplete(result.vehicle) ? "/cotizar/cotizacion" : "/cotizar/datos-incompletos");
}
