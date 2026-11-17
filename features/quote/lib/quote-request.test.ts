import { describe, expect, it } from "vitest";
import type { PlateRegistration, VehicleTypeOption } from "@/types/quote";
import { CATEGORY_MISMATCH, NOT_ONLINE, quoteRequestFor } from "./quote-request";
import { catalogTypeForClass } from "./use-matrix";

const PARTICULAR = { id: 5, name: "Particular" };
const TAXI = { id: 1, name: "Taxi" };
const CARGA = { id: 7, name: "Carga" };
const types: VehicleTypeOption[] = [
  { id: 1, name: "Automóvil", uses: [TAXI, PARTICULAR] },
  { id: 2, name: "Mototaxi", uses: [PARTICULAR, TAXI] },
  { id: 10, name: "Motocicleta", uses: [PARTICULAR] },
  { id: 16, name: "Motocarga", uses: [CARGA] },
  { id: 25, name: "Camioneta hasta 7 asientos", uses: [PARTICULAR, TAXI] },
  { id: 27, name: "Camioneta de 8 asientos", uses: [PARTICULAR, TAXI] },
  { id: 8, name: "Minivan (9 a 16 asientos)", uses: [PARTICULAR] },
];

const registration = (classId: number, extra: Partial<PlateRegistration> = {}): PlateRegistration => ({
  vehicleClassId: classId,
  ...extra,
});
const base = { category: "moto", use: "particular", documentType: "DNI", registration: null, types } as const;

describe("catalogTypeForClass", () => {
  it("maps La Positiva classes to catalog types, camionetas by seats", () => {
    expect(catalogTypeForClass(1)).toBe(1);
    expect(catalogTypeForClass(25)).toBe(2);
    expect(catalogTypeForClass(33, 5)).toBe(25);
    expect(catalogTypeForClass(33, 8)).toBe(27);
    expect(catalogTypeForClass(33)).toBe(25); // seats unknown: the vehicle form shows it
    expect(catalogTypeForClass(20)).toBe(3); // Microbús
    expect(catalogTypeForClass(34)).toBe(8); // Camioneta rural mayor de 9 asientos → Minivan
    expect(catalogTypeForClass(99)).toBeNull();
  });
});

describe("quoteRequestFor", () => {
  it("quotes with the registered type instead of the category's default", () => {
    expect(quoteRequestFor({ ...base, registration: registration(25) })).toEqual({ ok: true, typeId: 2, useId: 5 });
    // A registered mototaxi stays a Mototaxi whatever the use (Particular used to fall back to Motocicleta).
    expect(quoteRequestFor({ ...base, use: "taxi", registration: registration(25) })).toEqual({ ok: true, typeId: 2, useId: 1 });
    // Production AVL-443 (BAIC GRAND PLUS): class 34 is a minivan, not a microbús nor the default Automóvil.
    expect(quoteRequestFor({ ...base, category: "auto", registration: registration(34, { seats: 0 }) })).toEqual({
      ok: true,
      typeId: 8,
      useId: 5,
    });
    // Production camioneta rural F3U-390: class 33 with seats 0 (unknown) is a camioneta, not the default Automóvil.
    expect(quoteRequestFor({ ...base, category: "auto", registration: registration(33, { seats: 0 }) })).toEqual({
      ok: true,
      typeId: 25,
      useId: 5,
    });
    expect(quoteRequestFor({ ...base, category: "auto", registration: registration(33, { seats: 8 }) })).toEqual({
      ok: true,
      typeId: 27,
      useId: 5,
    });
  });

  it("falls back to the default type without registration data or with an unknown class", () => {
    expect(quoteRequestFor(base)).toEqual({ ok: true, typeId: 10, useId: 5 });
    expect(quoteRequestFor({ ...base, registration: registration(99) })).toEqual({ ok: true, typeId: 10, useId: 5 });
  });

  it("points at the use when the registered type does not allow it", () => {
    expect(quoteRequestFor({ ...base, use: "taxi", registration: registration(10) })).toEqual({
      ok: false,
      field: "use",
      message: "Según el registro vehicular, tu vehículo es de tipo Motocicleta: el uso Taxi no aplica. Elige Particular.",
    });
  });

  it("applies RUC + moto lineal (spec 4.2) when the registration says it is a Motocicleta", () => {
    const result = quoteRequestFor({ ...base, documentType: "RUC", registration: registration(10) });
    expect(result).toMatchObject({ ok: false, field: "use", message: expect.stringMatching(/Con RUC, una moto lineal/) });
    // A RUC mototaxi is fine.
    expect(quoteRequestFor({ ...base, documentType: "RUC", registration: registration(25) })).toMatchObject({ ok: true });
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

  it("cannot quote a use without an API id (Comercial) nor auto + Carga (no Camión type)", () => {
    expect(quoteRequestFor({ ...base, use: "comercial" })).toEqual({ ok: false, message: NOT_ONLINE });
    expect(quoteRequestFor({ ...base, category: "auto", use: "carga" })).toEqual({ ok: false, message: NOT_ONLINE });
  });
});
