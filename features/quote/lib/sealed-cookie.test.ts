import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { QuoteSession } from "../session";
import { MAX_COOKIE_BYTES, openCookie, sealCookie } from "./sealed-cookie";

const secret = "test-secret-at-least-32-characters-long";

// La Positiva's production tokens are ~680-character base64 KMS ciphertexts
// (QA ones are under 130); random bytes make it as incompressible as the real one.
const productionToken = `AQICAH${randomBytes(503).toString("base64").slice(0, 674)}`;

const features = [
  "Coberturas por ley",
  "Cobertura a nivel nacional",
  "Servicio de grúa*",
  "Servicio de auxilio mecánico",
  "100% digital",
].map((name) => ({ name, included: true }));

const vehicle = {
  plate: "BMD-261",
  typeId: 1,
  useId: 1,
  brand: { id: 10, name: "TOYOTA" },
  model: { id: "1234567", name: "YARIS CROSS" },
  version: { id: "7654321", name: "YARIS CROSS 1.5 XLI CVT HYBRID" },
  year: 2024,
  seats: 5,
  serial: "9BRBDWHE0P0123456",
  vin: "9BRBDWHE0P0123456",
  registeredCategory: "auto" as const,
};

const holder = {
  firstName: "María Fernanda Alejandra",
  lastName: "Quispe Huamán de la Cruz",
  address: "Av. Los Próceres de la Independencia 1234, Dpto. 1502, Torre B",
  state: "Lima",
  district: "San Juan de Lurigancho",
};

// A long-data session at the end of the flow, the largest the cookie gets.
const session: QuoteSession = {
  input: { plate: "BMD-261", documentType: "DNI", documentNumber: "12345678", use: "taxi", email: "maria.fernanda.quispe.huaman@empresa-de-ejemplo.com.pe" },
  request: {
    typeId: 1,
    useId: 1,
    ubigeoId: "150132",
    startDate: "2026-11-06",
    manual: { brandId: 10, modelId: "1234567", versionId: "7654321", seats: 5, year: 2024, serial: vehicle.serial, vin: vehicle.vin },
  },
  vehicleLookup: vehicle,
  result: {
    vehicle,
    holder,
    plans: [
      { id: 115, name: "SOAT DIGITAL", product: "SOAT", insurer: "La Positiva", priceCents: 12500, quoteToken: productionToken, features },
      { id: 89, name: "AFOCAT", product: "AFOCAT", insurer: "Lider", priceCents: 6000, quoteToken: null, features: features.slice(0, 1) },
      { id: 90, name: "AFOCAT Plus", product: "AFOCAT", insurer: "Lider", priceCents: 7500, quoteToken: null, features },
    ],
    featuredPlanId: 115,
  },
  holderDetails: { ...holder, reference: "Frente al parque zonal, puerta verde", email: "maria.fernanda.quispe.huaman@empresa-de-ejemplo.com.pe", phone: "987654321" },
  vehicleConfirmed: true,
  selection: { planId: 115 },
  order: { id: 123456, fingerprint: "f".repeat(64), status: "created" },
};

describe("sealCookie", () => {
  it("opens what it sealed", () => {
    const json = JSON.stringify(session);
    expect(openCookie(sealCookie(json, secret), secret)).toBe(json);
  });

  it("keeps a production-sized session well under the browser's cookie limit", () => {
    const sealed = sealCookie(JSON.stringify(session), secret);
    // Sealed it is ~2 KB; uncompressed it was ~4.5 KB, which the browser drops.
    // The margin covers more plans or longer data.
    expect("cs_quote=".length + sealed.length).toBeLessThan(MAX_COOKIE_BYTES * 0.6);
  });

  it("rejects a tampered cookie, another secret and garbage", () => {
    const sealed = sealCookie(JSON.stringify(session), secret);
    const tampered = `${sealed.slice(0, -2)}${sealed.endsWith("AA") ? "BB" : "AA"}`;
    expect(openCookie(tampered, secret)).toBeNull();
    expect(openCookie(sealed, "another-secret-of-at-least-32-chars!")).toBeNull();
    expect(openCookie("not-a-cookie", secret)).toBeNull();
  });
});
