import { describe, expect, it } from "vitest";
import type { QuoteSession } from "@/features/quote/session";
import { buildOrderRequest, orderFingerprint } from "./order-request";

const session: QuoteSession = {
  input: { plate: "ABC-123", documentType: "DNI", documentNumber: "12345678", use: "particular", email: "a@correo.pe" },
  request: { typeId: 1, useId: 5, ubigeoId: "150101", startDate: "2026-09-29" },
  result: {
    vehicle: {
      plate: "ABC-123",
      typeId: 1,
      useId: 5,
      brand: { id: 1035, name: "HYUNDAI" },
      model: { id: "1003272", name: "ACCENT" },
      version: { id: "10006180", name: "1.3" },
      year: 2018,
      seats: 5,
      serial: "SERIAL12345",
      vin: "VIN1234567890",
    },
    holder: { firstName: "MARTÍN JAVIER", lastName: "RODRIGUEZ" },
    plans: [
      {
        id: 1,
        name: "SOAT--La Positiva--Automóvil",
        product: "SOAT",
        insurer: "La Positiva",
        priceCents: 21000,
        quoteToken: "tok",
        features: [],
      },
    ],
    featuredPlanId: 1,
  },
  vehicleLookup: null,
  selection: { planId: 1 },
  holderDetails: {
    firstName: "MARTÍN JAVIER",
    lastName: "RODRIGUEZ",
    address: "Av. Primavera 1234",
    reference: "Urb. Los Álamos",
    state: "Lima",
    district: "Santiago de Surco",
    email: "otro@correo.pe",
    phone: "987654321",
  },
};

describe("buildOrderRequest", () => {
  it("builds the order from the session, with the plate as letters and digits only", () => {
    const request = buildOrderRequest(session);
    expect(request).toMatchObject({
      ok: true,
      input: {
        // Contact and address from the holder step; reference and province go in the address text.
        driver: {
          documentTypeId: 1,
          documentNumber: "12345678",
          address: "Av. Primavera 1234, Urb. Los Álamos, Lima",
          phone: "987654321",
          email: "otro@correo.pe",
        },
        vehicle: { plate: "ABC123", brandId: 1035, modelId: "1003272", versionId: "10006180", ubigeoId: "150101" },
        plan: { id: 1, priceCents: 21000, quoteToken: "tok" },
        startDate: "2026-09-29",
      },
    });
  });

  it("sends the company name with RUC", () => {
    const request = buildOrderRequest({
      ...session,
      input: { ...session.input, documentType: "RUC", documentNumber: "20123456789" },
      result: { ...session.result, holder: { companyName: "TRANSPORTES LIMA S.A.C." } },
    });
    expect(request.ok && request.input.driver).toMatchObject({ documentTypeId: 2, companyName: "TRANSPORTES LIMA S.A.C." });
  });

  it("says what is missing", () => {
    expect(buildOrderRequest({ ...session, selection: undefined })).toEqual({ ok: false, missing: "selection" });
    expect(buildOrderRequest({ ...session, selection: { planId: 99 } })).toEqual({
      ok: false,
      missing: "selection",
    });
    expect(buildOrderRequest({ ...session, holderDetails: undefined })).toEqual({ ok: false, missing: "holder" });
    const vehicle = session.result.vehicle && { ...session.result.vehicle, serial: undefined };
    expect(buildOrderRequest({ ...session, result: { ...session.result, vehicle } })).toEqual({
      ok: false,
      missing: "vehicle",
    });
  });
});

describe("orderFingerprint", () => {
  it("changes only when the order data changes", () => {
    const first = buildOrderRequest(session);
    const same = buildOrderRequest({ ...session, order: { id: 7, fingerprint: "x", status: "created" } });
    const otherPhone = buildOrderRequest({
      ...session,
      holderDetails: session.holderDetails && { ...session.holderDetails, phone: "912345678" },
    });
    if (!first.ok || !same.ok || !otherPhone.ok) throw new Error("expected complete sessions");

    expect(orderFingerprint(same.input)).toBe(orderFingerprint(first.input));
    expect(orderFingerprint(otherPhone.input)).not.toBe(orderFingerprint(first.input));
  });
});
