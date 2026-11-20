import { describe, expect, it } from "vitest";
import type { PlateRegistration, VehicleTypeOption } from "@/types/quote";
import { RUC_MOTO_LINEAL } from "../vehicle-schema";
import { CATEGORY_MISMATCH, NOT_ONLINE, quoteRequestFor } from "./quote-request";

const PARTICULAR = { id: 5, name: "Particular" };
const TAXI = { id: 1, name: "Taxi" };
const CARGA = { id: 7, name: "Carga" };
const COMERCIAL = { id: 6, name: "Comercial" };
const types: VehicleTypeOption[] = [
  { id: 1, name: "Automóvil", uses: [TAXI, PARTICULAR] },
  { id: 2, name: "Mototaxi", uses: [PARTICULAR, TAXI] },
  { id: 10, name: "Motocicleta", uses: [PARTICULAR, COMERCIAL] },
  { id: 16, name: "Motocarga", uses: [CARGA] },
  { id: 25, name: "Camioneta hasta 7 asientos", uses: [PARTICULAR, TAXI] },
  { id: 27, name: "Camioneta de 8 asientos", uses: [PARTICULAR, TAXI] },
  { id: 8, name: "Minivan (9 a 16 asientos)", uses: [PARTICULAR] },
  { id: 34, name: "Cmta. Pick Up/Doble Cabina", uses: [CARGA, PARTICULAR] },
  { id: 35, name: "Cmta. Pick Up/Cabina Simple", uses: [CARGA, PARTICULAR] },
];

// The backend matches the registered class to a catalog type (`type.id` of /query-plate).
const registration = (typeId: number, extra: Partial<PlateRegistration> = {}): PlateRegistration => ({
  typeId,
  ...extra,
});
const base = { category: "moto", use: "particular", documentType: "DNI", registration: null, types } as const;

describe("quoteRequestFor", () => {
  it("quotes with the registered type instead of the category's default", () => {
    expect(quoteRequestFor({ ...base, registration: registration(2) })).toEqual({ ok: true, typeId: 2, useId: 5 });
    // A registered mototaxi stays a Mototaxi whatever the use (Particular used to fall back to Motocicleta).
    expect(quoteRequestFor({ ...base, use: "taxi", registration: registration(2) })).toEqual({ ok: true, typeId: 2, useId: 1 });
    // Production BKD-931 (class 16): a double-cab pickup, not the default Automóvil.
    expect(quoteRequestFor({ ...base, category: "auto", registration: registration(34) })).toEqual({
      ok: true,
      typeId: 34,
      useId: 5,
    });
    // Production AVL-443 (class 34): a minivan.
    expect(quoteRequestFor({ ...base, category: "auto", registration: registration(8) })).toEqual({
      ok: true,
      typeId: 8,
      useId: 5,
    });
    expect(quoteRequestFor({ ...base, category: "auto", registration: registration(27) })).toEqual({
      ok: true,
      typeId: 27,
      useId: 5,
    });
  });

  it("falls back to the default type without registration data or with an unknown class", () => {
    expect(quoteRequestFor(base)).toEqual({ ok: true, typeId: 10, useId: 5 });
    // A type the catalog does not list (or no `type.id`: the class has no type).
    expect(quoteRequestFor({ ...base, registration: registration(99) })).toEqual({ ok: true, typeId: 10, useId: 5 });
    expect(quoteRequestFor({ ...base, registration: {} })).toEqual({ ok: true, typeId: 10, useId: 5 });
  });

  it("points at the use when the registered type does not allow it", () => {
    expect(quoteRequestFor({ ...base, use: "taxi", registration: registration(10) })).toEqual({
      ok: false,
      field: "use",
      message: "Según el registro vehicular, tu vehículo es de tipo Motocicleta: el uso Taxi no aplica. Elige Particular o Comercial.",
    });
  });

  it("applies RUC + moto lineal (spec 4.2) when the registration says it is a Motocicleta", () => {
    const result = quoteRequestFor({ ...base, documentType: "RUC", registration: registration(10) });
    expect(result).toEqual({ ok: false, field: "use", message: RUC_MOTO_LINEAL });
    // Production 5881-MB with RUC: Comercial (id 6) is quoted.
    expect(quoteRequestFor({ ...base, use: "comercial", documentType: "RUC", registration: registration(10) })).toEqual({
      ok: true,
      typeId: 10,
      useId: 6,
    });
    // A RUC mototaxi is fine, but not as Comercial (moto lineal only).
    expect(quoteRequestFor({ ...base, use: "comercial", registration: registration(2) })).toMatchObject({ ok: false, field: "use" });
    expect(quoteRequestFor({ ...base, documentType: "RUC", registration: registration(2) })).toMatchObject({ ok: true });
  });

  it("applies RUC + moto lineal to the default type when the plate lookup brought nothing", () => {
    expect(quoteRequestFor({ ...base, documentType: "RUC" })).toEqual({ ok: false, field: "use", message: RUC_MOTO_LINEAL });
    expect(quoteRequestFor({ ...base, use: "comercial", documentType: "RUC" })).toEqual({ ok: true, typeId: 10, useId: 6 });
    // Taxi defaults to Mototaxi, which RUC can quote.
    expect(quoteRequestFor({ ...base, use: "taxi", documentType: "RUC" })).toEqual({ ok: true, typeId: 2, useId: 1 });
  });

  it("stops when the registration contradicts the plate's category (spec 4.1)", () => {
    expect(quoteRequestFor({ ...base, category: "auto", registration: { category: "moto" } })).toEqual({
      ok: false,
      message: CATEGORY_MISMATCH.auto,
    });
    expect(quoteRequestFor({ ...base, registration: registration(1) })).toEqual({
      ok: false,
      message: CATEGORY_MISMATCH.moto,
    });
  });

  it("quotes Comercial as a Motocicleta by default; auto + Carga cannot be quoted (no Camión type)", () => {
    expect(quoteRequestFor({ ...base, use: "comercial" })).toEqual({ ok: true, typeId: 10, useId: 6 });
    expect(quoteRequestFor({ ...base, category: "auto", use: "carga" })).toEqual({ ok: false, message: NOT_ONLINE });
  });
});
