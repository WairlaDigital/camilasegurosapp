import { describe, expect, it } from "vitest";
import { parseQuoteForm } from "./quote-schema";

const rules = { today: "2026-09-27", planIds: [1, 2] };
const valid = { planId: "1", startDate: "2026-09-27" };

function errorsFor(input: Record<string, unknown>) {
  const result = parseQuoteForm(input, rules);
  return result.ok ? {} : result.errors;
}

describe("parseQuoteForm", () => {
  it("accepts a plan of the quote and a date from today", () => {
    expect(parseQuoteForm(valid, rules)).toEqual({ ok: true, data: { planId: 1, startDate: "2026-09-27" } });
  });

  it("asks to choose a plan when none was chosen or it is not in the quote", () => {
    expect(errorsFor({ ...valid, planId: "" }).planId).toBe("Elige tu plan con «Lo quiero» para continuar.");
    expect(errorsFor({ ...valid, planId: "99" }).planId).toBe("Elige tu plan con «Lo quiero» para continuar.");
  });

  it("rejects past dates and dates more than a year ahead", () => {
    expect(errorsFor({ ...valid, startDate: "2026-09-26" }).startDate).toBe("La fecha no puede ser anterior a hoy.");
    expect(errorsFor({ ...valid, startDate: "2027-09-28" }).startDate).toMatch(/próximos 12 meses/);
    expect(errorsFor({ ...valid, startDate: "27/09/2026" }).startDate).toBe("Selecciona una fecha válida.");
  });

  it("reports every field at once", () => {
    expect(Object.keys(errorsFor({}))).toEqual(["planId", "startDate"]);
  });
});
