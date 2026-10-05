import { z } from "zod";
import { addDays } from "./lib/dates";

// Quote screen form (plan and start date). Shared by the form and the Server Action.

/** PROVISIONAL sanity limit until La Positiva confirms how far ahead a policy can start. */
export const MAX_START_DAYS = 365;

const CHOOSE_PLAN = "Elige tu plan con «Lo quiero» para continuar.";

const quoteSchema = z.object({
  planId: z.coerce.number({ error: CHOOSE_PLAN }).int(CHOOSE_PLAN).positive(CHOOSE_PLAN),
  startDate: z.iso.date({ error: "Selecciona una fecha válida." }),
});

export type QuoteFormValues = z.output<typeof quoteSchema>;
export type QuoteField = keyof QuoteFormValues;
export type QuoteFieldErrors = Partial<Record<QuoteField, string>>;

export type QuoteParseResult = { ok: true; data: QuoteFormValues } | { ok: false; errors: QuoteFieldErrors };

type QuoteRules = {
  /** YYYY-MM-DD in Lima: a policy cannot start in the past. */
  today: string;
  /** Plans of the current quote: the id must be one of them. */
  planIds: number[];
};

/** Why a start date cannot be quoted, or undefined when it can. */
export function startDateError(startDate: string, today: string): string | undefined {
  if (!z.iso.date().safeParse(startDate).success) return "Selecciona una fecha válida.";
  if (startDate < today) return "La fecha no puede ser anterior a hoy.";
  if (startDate > addDays(today, MAX_START_DAYS)) return "Elige una fecha dentro de los próximos 12 meses.";
  return undefined;
}

export function parseQuoteForm(input: Record<string, unknown>, { today, planIds }: QuoteRules): QuoteParseResult {
  // Empty inputs arrive as "" and would coerce to 0: treat them as missing.
  const values = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== ""));
  const result = quoteSchema.safeParse(values);
  const errors: QuoteFieldErrors = {};

  if (!result.success) {
    const fieldErrors = z.flattenError(result.error).fieldErrors;
    for (const field of Object.keys(fieldErrors) as QuoteField[]) errors[field] = fieldErrors[field]?.[0];
  }

  if (result.success) {
    const { planId, startDate } = result.data;
    if (!planIds.includes(planId)) errors.planId = CHOOSE_PLAN;
    const dateError = startDateError(startDate, today);
    if (dateError) errors.startDate = dateError;
  }

  if (result.success && Object.keys(errors).length === 0) return { ok: true, data: result.data };
  return { ok: false, errors };
}
