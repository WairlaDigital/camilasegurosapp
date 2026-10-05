import { describe, expect, it } from "vitest";
import { lockedHolderFields, parseHolderForm } from "./holder-schema";

const valid = {
  firstName: "Martín Javier",
  lastName: "Rodríguez Gonzales",
  address: "Av. Primavera 1234, dpto. 501",
  reference: "Urb. Los Álamos",
  state: "Lima",
  district: "Santiago de Surco",
  email: "cliente@correo.pe",
  phone: "987654321",
};

function errorsFor(input: Record<string, unknown>, locked = {}) {
  const result = parseHolderForm(input, locked);
  return result.ok ? {} : result.errors;
}

describe("parseHolderForm", () => {
  it("accepts a complete form and trims the values", () => {
    const result = parseHolderForm({ ...valid, address: "  Av. Primavera 1234, dpto. 501 ", phone: "+51 987 654 321" }, {});
    expect(result).toEqual({ ok: true, data: valid });
  });

  it("the reference is optional", () => {
    const result = parseHolderForm({ ...valid, reference: "" }, {});
    expect(result.ok && result.data.reference).toBeUndefined();
  });

  it("reports every missing field at once", () => {
    expect(errorsFor({})).toEqual({
      firstName: "Ingresa los nombres.",
      lastName: "Ingresa los apellidos.",
      address: "Ingresa tu domicilio.",
      state: "Selecciona el departamento.",
      district: "Selecciona el distrito.",
      email: "Ingresa un correo válido.",
      phone: "Ingresa tu número de celular.",
    });
  });

  it("uses the backend's rule for names: letters and spaces only", () => {
    expect(errorsFor({ ...valid, lastName: "O'Higgins" }).lastName).toBe("Solo letras y espacios.");
    expect(errorsFor({ ...valid, firstName: "Ñusta" }).firstName).toBeUndefined();
  });

  it("only accepts Lima or Callao, with a district of that department", () => {
    expect(errorsFor({ ...valid, state: "Arequipa" }).state).toBe("Selecciona el departamento.");
    expect(errorsFor({ ...valid, state: "Callao", district: "Santiago de Surco" }).district).toBe("Selecciona el distrito.");
    expect(errorsFor({ ...valid, state: "Callao", district: "Bellavista" })).toEqual({});
  });

  it("requires a 9-digit mobile number starting with 9", () => {
    expect(errorsFor({ ...valid, phone: "187654321" }).phone).toMatch(/9 dígitos/);
  });

  it("keeps the API's values even if the form sends others, including a department outside the list", () => {
    const locked = { firstName: "MARTÍN JAVIER", lastName: "RODRIGUEZ GONZALES", state: "AREQUIPA", district: "YANAHUARA" };
    const result = parseHolderForm({ ...valid, firstName: "Otro", state: "" }, locked);
    expect(result.ok && result.data).toMatchObject({ firstName: "MARTÍN JAVIER", state: "AREQUIPA", district: "YANAHUARA" });
  });
});

describe("lockedHolderFields", () => {
  it("locks what the API returned: names for a person, address for a company", () => {
    expect(lockedHolderFields({ firstName: "MARTÍN", lastName: "RODRIGUEZ" })).toEqual({
      firstName: "MARTÍN",
      lastName: "RODRIGUEZ",
    });
    expect(
      lockedHolderFields({ companyName: "TRANSPORTES SAC", address: "AV. LIMA 123", state: "LIMA", district: "LINCE" }),
    ).toEqual({ address: "AV. LIMA 123", state: "LIMA", district: "LINCE" });
    expect(lockedHolderFields(null)).toEqual({});
  });
});
