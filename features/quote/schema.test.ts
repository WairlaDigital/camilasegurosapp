import { describe, expect, it } from "vitest";
import { parseStartQuote } from "./schema";

const valid = {
  plate: "abc-123",
  documentType: "DNI",
  documentNumber: "12345678",
  use: "particular",
  email: "cliente@correo.pe",
  consent: "on",
};

function errorsFor(input: Record<string, unknown>) {
  const result = parseStartQuote(input);
  return result.ok ? {} : result.errors;
}

describe("parseStartQuote", () => {
  it("accepts a complete form and normalizes the values", () => {
    const result = parseStartQuote({ ...valid, documentType: "CE", documentNumber: " ab12345 " });
    expect(result).toEqual({
      ok: true,
      data: { ...valid, plate: "ABC-123", documentType: "CE", documentNumber: "AB12345" },
    });
  });

  it("reports every missing field at once", () => {
    expect(errorsFor({ documentType: "DNI" })).toEqual({
      plate: "Ingresa tu placa.",
      documentNumber: "Ingresa tu número de documento.",
      use: "Selecciona el uso de tu vehículo.",
      email: "Ingresa un correo válido.",
      consent: "Debes aceptar el consentimiento para continuar.",
    });
  });

  it("rejects an invalid plate", () => {
    expect(errorsFor({ ...valid, plate: "ABC-12" }).plate).toMatch(/placa válida/);
  });

  describe("document number by type", () => {
    it.each([
      ["DNI", "1234567", /8 dígitos/],
      ["DNI", "1234567A", /8 dígitos/],
      ["RUC", "30123456789", /empieza con 10 o 20/],
      ["RUC", "2012345678", /11 dígitos/],
      ["CE", "AB12", /carné de extranjería/],
    ])("%s %s is invalid", (documentType, documentNumber, message) => {
      expect(errorsFor({ ...valid, documentType, documentNumber }).documentNumber).toMatch(message);
    });

    it.each([
      ["DNI", "12345678"],
      ["RUC", "10123456789"],
      ["RUC", "20123456789"],
      ["CE", "001234567"],
    ])("%s %s is valid", (documentType, documentNumber) => {
      expect(parseStartQuote({ ...valid, documentType, documentNumber }).ok).toBe(true);
    });

    it("checks the number even when other fields fail", () => {
      expect(errorsFor({ documentType: "RUC", documentNumber: "123" }).documentNumber).toMatch(/RUC/);
    });
  });

  describe("use by plate category", () => {
    it("rejects Comercial for an auto plate", () => {
      expect(errorsFor({ ...valid, use: "comercial" }).use).toMatch(/no aplica/);
    });

    it("accepts Comercial for a moto plate", () => {
      expect(parseStartQuote({ ...valid, plate: "1234-AB", use: "comercial" }).ok).toBe(true);
    });

    it("rejects an unknown use", () => {
      expect(errorsFor({ ...valid, use: "otro" }).use).toBe("Selecciona el uso de tu vehículo.");
    });
  });

  it("requires the consent checkbox", () => {
    expect(errorsFor({ ...valid, consent: undefined }).consent).toMatch(/consentimiento/);
  });

  it("rejects an invalid email", () => {
    expect(errorsFor({ ...valid, email: "cliente@" }).email).toBe("Ingresa un correo válido.");
  });
});
