import { describe, expect, it } from "vitest";
import {
  isAfocatPlan,
  isVehicleComplete,
  planDisplayName,
  queryInfoResponseSchema,
  toQuoteResult,
} from "./quote.schema";

const request = { typeId: 1, useId: 5 };

// Shape returned by POST /query-info (see docs/api.md).
const response = {
  document: { names: "MARTÍN JAVIER", last_name: "RODRIGUEZ", company_name: null },
  vehicle: {
    plate: "AEF-710",
    year: 2016,
    seats: null,
    serial: null,
    vin: null,
    brand: { id: 1035, name: "HYUNDAI", positiva: { id: 5, name: "HYUNDAI" } },
    model: { positiva: { id: 1003280, name: "H1" } },
    version: null,
  },
  plans: {
    featured: 1,
    plans: [
      {
        id: 1,
        name: "SOAT--La Positiva--Automóvil",
        price: 83.5,
        quote_token: "tok",
        features: [{ name: "Coberturas por ley", status: true }],
      },
    ],
  },
};

describe("toQuoteResult", () => {
  const result = toQuoteResult(queryInfoResponseSchema.parse(response), request);

  it("maps the vehicle: local brand id, La Positiva model id, missing fields as undefined", () => {
    expect(result.vehicle).toEqual({
      plate: "AEF-710",
      typeId: 1,
      useId: 5,
      brand: { id: 1035, name: "HYUNDAI" },
      model: { id: "1003280", name: "H1" },
      version: undefined,
      year: 2016,
      seats: undefined,
      serial: undefined,
      vin: undefined,
    });
  });

  it("converts prices in soles to integer cents", () => {
    expect(result.plans[0].priceCents).toBe(8350);
  });

  it("maps the holder and plan features", () => {
    expect(result.holder).toEqual({ firstName: "MARTÍN JAVIER", lastName: "RODRIGUEZ", companyName: undefined });
    expect(result.plans[0].features).toEqual([{ name: "Coberturas por ley", included: true }]);
    expect(result.featuredPlanId).toBe(1);
  });

  it("splits the plan name into product and insurer", () => {
    expect(result.plans[0]).toMatchObject({ product: "SOAT", insurer: "La Positiva" });
  });

  it("drops AFOCAT plans and a featured id that pointed to one", () => {
    const afocat = { id: 89, name: "AFOCAT--Lider--Automóvil", price: 60, features: [] };
    const withAfocat = { ...response, plans: { featured: 89, plans: [...response.plans.plans, afocat] } };
    const mapped = toQuoteResult(queryInfoResponseSchema.parse(withAfocat), request);
    expect(mapped.plans.map((plan) => plan.id)).toEqual([1]);
    expect(mapped.featuredPlanId).toBeNull();
  });

  it("returns a null vehicle when the plate lookup failed (no vehicle key)", () => {
    const { vehicle, ...rest } = response;
    expect(vehicle).toBeDefined();
    expect(toQuoteResult(queryInfoResponseSchema.parse(rest), request).vehicle).toBeNull();
  });

  it("rejects a response that breaks the contract", () => {
    expect(queryInfoResponseSchema.safeParse({ plans: { plans: [{ id: "x" }] } }).success).toBe(false);
  });
});

describe("planDisplayName", () => {
  it("normalizes the spacing and the La Positiva variants found in the backend", () => {
    expect(planDisplayName("SOAT DIGITAL-- Positiva -- Automovil -- Particular")).toEqual({
      product: "SOAT DIGITAL",
      insurer: "La Positiva",
    });
    expect(planDisplayName("SOAT DIGITAL -- La Positiva Seguros--Minivan de 9  a 16 asientos")).toEqual({
      product: "SOAT DIGITAL",
      insurer: "La Positiva",
    });
  });

  it("keeps a name without separators as the product", () => {
    expect(planDisplayName("SOAT")).toEqual({ product: "SOAT", insurer: "" });
  });
});

describe("isAfocatPlan", () => {
  it("matches the AFOCAT product only", () => {
    expect(isAfocatPlan("AFOCAT--Metropolitana--COMBI--Servicio urbano")).toBe(true);
    expect(isAfocatPlan("SOAT -- Positiva -- Camion < 12 Ton -- Carga")).toBe(false);
  });
});

describe("isVehicleComplete", () => {
  const complete = {
    plate: "ABC-123",
    typeId: 1,
    useId: 5,
    brand: { id: 1, name: "HYUNDAI" },
    model: { id: "1", name: "ACCENT" },
    version: { id: "2", name: "1.3" },
    year: 2018,
    seats: 5,
    serial: "SERIAL12345",
    vin: "VIN1234567890",
  };

  it("requires every vehicle field", () => {
    expect(isVehicleComplete(complete)).toBe(true);
    expect(isVehicleComplete({ ...complete, version: undefined })).toBe(false);
    expect(isVehicleComplete({ ...complete, vin: undefined })).toBe(false);
    expect(isVehicleComplete(null)).toBe(false);
  });
});
