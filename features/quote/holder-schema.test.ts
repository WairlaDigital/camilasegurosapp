import { describe, expect, it } from "vitest";
import { lockedHolderFields, parseHolderForm } from "./holder-schema";

const valid = {
  firstName: "Martín Javier",
  lastName: "Rodríguez Gonzales",
  address: "Av. Primavera 1234, dpto. 501",
  state: "Lima",
  district: "Santiago de Surco",
};

function errorsFor(input: Record<string, unknown>, locked = {}) {
  const result = parseHolderForm(input, locked);
  return result.ok ? {} : result.errors;
}

describe("parseHolderForm", () => {
  it("accepts a complete form and trims the values", () => {
    const result = parseHolderForm({ ...valid, district: "  Santiago de Surco " }, {});
    expect(result).toEqual({ ok: true, data: { ...valid, district: "Santiago de Surco" } });
  });

  it("reports every missing field at once", () => {
    expect(errorsFor({})).toEqual({
      firstName: "Ingresa los nombres.",
      lastName: "Ingresa los apellidos.",
      address: "Ingresa tu domicilio.",
      state: "Selecciona el departamento.",
      district: "Ingresa el distrito.",
    });
  });

  it("uses the backend's rule for names: letters and spaces only", () => {
    expect(errorsFor({ ...valid, lastName: "O'Higgins" }).lastName).toBe("Solo letras y espacios.");
    expect(errorsFor({ ...valid, firstName: "Ñusta" }).firstName).toBeUndefined();
  });

  it("only accepts departments from the list", () => {
    expect(errorsFor({ ...valid, state: "Lima Metropolitana" }).state).toBe("Selecciona el departamento.");
  });

  it("keeps the API's values even if the form sends others", () => {
    const locked = { firstName: "MARTÍN JAVIER", lastName: "RODRIGUEZ GONZALES", state: "LIMA" };
    const result = parseHolderForm({ ...valid, firstName: "Otro", state: "" }, locked);
    expect(result.ok && result.data).toMatchObject({ firstName: "MARTÍN JAVIER", state: "LIMA" });
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
