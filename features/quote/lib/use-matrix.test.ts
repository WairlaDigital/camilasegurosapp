import { describe, expect, it } from "vitest";
import type { VehicleTypeOption } from "@/types/quote";
import { allowedUses, typeCategory, typesForCategory, USE_MATRIX } from "./use-matrix";
import { defaultQuoteRequest, USES_BY_CATEGORY, VEHICLE_USE_KEYS } from "./vehicle-rules";

// Catalog as GET /data returns it (see e2e/mock-api and docs/flujo.md).
const PARTICULAR = { id: 5, name: "Particular" };
const TAXI = { id: 1, name: "Taxi" };
const CARGA = { id: 7, name: "Carga" };
const types: VehicleTypeOption[] = [
  { id: 1, name: "Automóvil", uses: [TAXI, PARTICULAR] },
  { id: 2, name: "Mototaxi", uses: [PARTICULAR, TAXI] },
  { id: 8, name: "Minivan (9 a 16 asientos)", uses: [PARTICULAR] },
  { id: 10, name: "Motocicleta", uses: [PARTICULAR] },
  { id: 16, name: "Motocarga", uses: [CARGA] },
];
const type = (id: number) => types.find((option) => option.id === id)!;

describe("allowedUses (spec section 2)", () => {
  it("keeps the table's uses that the catalog also has", () => {
    expect(allowedUses(type(1), "DNI")).toEqual([TAXI, PARTICULAR]);
    expect(allowedUses(type(2), "DNI")).toEqual([PARTICULAR, TAXI]);
    expect(allowedUses(type(16), "DNI")).toEqual([CARGA]);
  });

  it("drops a catalog use that the table does not allow", () => {
    const automovilWithCarga = { ...type(1), uses: [...type(1).uses, CARGA] };
    expect(allowedUses(automovilWithCarga, "DNI")).toEqual([TAXI, PARTICULAR]);
  });

  it("leaves 'Comercial' out of moto lineal until it has an API id", () => {
    expect(allowedUses(type(10), "DNI")).toEqual([PARTICULAR]);
  });

  it("with RUC, a moto lineal can only be Comercial (spec 4.2), so nothing can be quoted yet", () => {
    expect(allowedUses(type(10), "RUC")).toEqual([]);
    expect(allowedUses(type(2), "RUC")).toEqual([PARTICULAR, TAXI]); // not for mototaxis
    expect(allowedUses(type(1), "RUC")).toEqual([TAXI, PARTICULAR]); // nor for autos
  });

  it("follows the catalog for types outside the table", () => {
    expect(allowedUses(type(8), "DNI")).toEqual([PARTICULAR]);
  });
});

describe("typeCategory and typesForCategory (spec 4.1: the category is fixed)", () => {
  it("classifies motos, mototaxis and motocargas as moto and everything else as auto", () => {
    expect(typeCategory(10)).toBe("moto");
    expect(typeCategory(8)).toBe("auto");
    expect(typesForCategory(types, "moto").map((option) => option.id)).toEqual([2, 10, 16]);
    expect(typesForCategory(types, "auto").map((option) => option.id)).toEqual([1, 8]);
  });
});

describe("home form rules agree with the table", () => {
  it("offers per category exactly the uses of that category's rows", () => {
    for (const category of ["auto", "moto"] as const) {
      const fromTable = new Set(
        Object.values(USE_MATRIX)
          .filter((row) => row.category === category)
          .flatMap((row) => row.uses),
      );
      expect(new Set(USES_BY_CATEGORY[category])).toEqual(fromTable);
    }
  });

  it("quotes each use with a default type that allows it", () => {
    for (const category of ["auto", "moto"] as const) {
      for (const use of VEHICLE_USE_KEYS) {
        const request = defaultQuoteRequest(category, use);
        if (!request) continue; // not quotable online yet
        expect(typeCategory(request.typeId)).toBe(category);
        const catalogType = type(request.typeId);
        expect(allowedUses(catalogType, "DNI").map((option) => option.id)).toContain(request.useId);
      }
    }
  });
});
