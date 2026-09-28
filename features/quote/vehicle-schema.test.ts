import { describe, expect, it } from "vitest";
import type { VehicleTypeOption } from "@/types/quote";
import { defaultQuoteRequest } from "./lib/vehicle-rules";
import { parseVehicleForm } from "./vehicle-schema";

const types: VehicleTypeOption[] = [
  { id: 1, name: "Automóvil", uses: [{ id: 1, name: "Taxi" }, { id: 5, name: "Particular" }] },
  { id: 10, name: "Motocicleta", uses: [{ id: 5, name: "Particular" }] },
];
const rules = { types, documentType: "DNI" as const };

const valid = {
  useId: "5",
  typeId: "1",
  brandId: "1035",
  brandName: "HYUNDAI",
  modelId: "1003280",
  modelName: "H1",
  versionId: "10009000",
  versionName: "H1 2.5 CRDI",
  seats: "6",
  year: "2016",
  serial: "kmhnrc87kdj",
  vin: "kmhnrc87kdjhhsi87",
};

const errorsFor = (input: Record<string, unknown>) => {
  const result = parseVehicleForm(input, rules);
  return result.ok ? {} : result.errors;
};

describe("parseVehicleForm", () => {
  it("accepts a complete form, coerces numbers and uppercases serial and VIN", () => {
    const result = parseVehicleForm(valid, rules);
    expect(result.ok && result.data).toMatchObject({
      useId: 5,
      typeId: 1,
      brandId: 1035,
      seats: 6,
      year: 2016,
      serial: "KMHNRC87KDJ",
      vin: "KMHNRC87KDJHHSI87",
    });
  });

  it("treats empty inputs as missing instead of zero", () => {
    const errors = errorsFor({ ...valid, seats: "", year: "", brandId: "" });
    expect(errors.seats).toBe("Ingresa el número de asientos.");
    expect(errors.year).toBe("Ingresa el año de fabricación.");
    expect(errors.brandId).toBe("Busca y elige la marca de la lista.");
  });

  it("requires a use allowed for the vehicle type", () => {
    expect(errorsFor({ ...valid, typeId: "10", useId: "1" }).useId).toMatch(/no aplica/);
  });

  it("applies the table of spec section 2, including RUC + moto lineal (spec 4.2)", () => {
    const automovilWithCarga = { ...types[0], uses: [...types[0].uses, { id: 7, name: "Carga" }] };
    const withCarga = parseVehicleForm({ ...valid, useId: "7" }, { ...rules, types: [automovilWithCarga] });
    expect(!withCarga.ok && withCarga.errors.useId).toMatch(/no aplica/);

    const ruc = parseVehicleForm({ ...valid, typeId: "10", useId: "5" }, { ...rules, documentType: "RUC" });
    expect(!ruc.ok && ruc.errors.useId).toMatch(/Con RUC, una moto lineal solo puede tener uso Comercial/);
  });

  it("rejects a type outside the plate's category (not in the list it receives)", () => {
    const autoTypes = { ...rules, types: [types[0]] };
    const result = parseVehicleForm({ ...valid, typeId: "10" }, autoTypes);
    expect(!result.ok && result.errors.typeId).toBe("Selecciona el tipo de vehículo.");
  });

  it("rejects an unknown vehicle type", () => {
    expect(errorsFor({ ...valid, typeId: "99" }).typeId).toBe("Selecciona el tipo de vehículo.");
  });

  it.each([
    ["seats", "0", /entre 1 y 99/],
    ["seats", "100", /entre 1 y 99/],
    ["year", "1979", /Debe ser entre 1980/],
    ["serial", "ABC12", /número de serie/],
    ["vin", "VIN-123456", /VIN/],
  ])("%s = %s is invalid", (field, value, message) => {
    expect(errorsFor({ ...valid, [field]: value })[field as keyof typeof valid]).toMatch(message);
  });

  it("never shows the library's default (English) messages", () => {
    const errors = errorsFor({});
    for (const message of Object.values(errors)) expect(message).not.toMatch(/Invalid|expected/);
    expect(Object.keys(errors).sort()).toEqual(
      ["brandId", "modelId", "seats", "serial", "typeId", "useId", "versionId", "vin", "year"].sort(),
    );
  });

  it("requires model and version from the catalog", () => {
    const errors = errorsFor({ ...valid, modelId: "", versionId: "" });
    expect(errors.modelId).toBe("Selecciona el modelo.");
    expect(errors.versionId).toBe("Selecciona la versión.");
  });
});

describe("defaultQuoteRequest (provisional defaults)", () => {
  it.each([
    ["auto", "particular", { typeId: 1, useId: 5 }],
    ["auto", "taxi", { typeId: 1, useId: 1 }],
    ["moto", "taxi", { typeId: 2, useId: 1 }],
    ["moto", "carga", { typeId: 16, useId: 7 }],
  ] as const)("%s + %s", (category, use, expected) => {
    expect(defaultQuoteRequest(category, use)).toEqual(expected);
  });

  it("returns null when the combination cannot be quoted online yet", () => {
    expect(defaultQuoteRequest("auto", "carga")).toBeNull(); // no Camión/Furgón type
    expect(defaultQuoteRequest("moto", "comercial")).toBeNull(); // no use id yet
  });
});
