import { describe, expect, it } from "vitest";
import { limitPhone, normalizePhone, parseQuoteForm } from "./quote-schema";

const rules = { today: "2026-09-27", planIds: [1, 2] };
const valid = { planId: "1", startDate: "2026-09-27", phone: "987654321" };

function errorsFor(input: Record<string, unknown>) {
  const result = parseQuoteForm(input, rules);
  return result.ok ? {} : result.errors;
}

describe("normalizePhone", () => {
  it("keeps the digits and drops Peru's country code", () => {
    expect(normalizePhone("987 654 321")).toBe("987654321");
    expect(normalizePhone("+51 987654321")).toBe("987654321");
    expect(normalizePhone("51987654321")).toBe("987654321");
    expect(normalizePhone("519876543")).toBe("519876543"); // 9 digits: not a prefix
  });
});

describe("limitPhone", () => {
  it("keeps at most 9 digits after dropping the country code", () => {
    expect(limitPhone("98765432112")).toBe("987654321");
    expect(limitPhone("+51 987 654 321")).toBe("987654321");
    expect(limitPhone("9876")).toBe("9876");
  });
});

describe("parseQuoteForm", () => {
  it("accepts a plan of the quote, a date from today and a mobile number", () => {
    expect(parseQuoteForm({ ...valid, phone: "987 654 321" }, rules)).toEqual({
      ok: true,
      data: { planId: 1, startDate: "2026-09-27", phone: "987654321" },
    });
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

  it("requires a 9-digit mobile number starting with 9", () => {
    expect(errorsFor({ ...valid, phone: "" }).phone).toBe("Ingresa tu número de celular.");
    expect(errorsFor({ ...valid, phone: "187654321" }).phone).toMatch(/9 dígitos/);
    expect(errorsFor({ ...valid, phone: "98765432" }).phone).toMatch(/9 dígitos/);
  });

  it("accepts the phone with the +51 prefix, spaces or dashes", () => {
    const result = parseQuoteForm({ ...valid, phone: "+51 987-654-321" }, rules);
    expect(result.ok && result.data.phone).toBe("987654321");
  });

  it("reports every field at once", () => {
    expect(Object.keys(errorsFor({}))).toEqual(["planId", "startDate", "phone"]);
  });
});
