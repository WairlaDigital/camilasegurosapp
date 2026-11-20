import { describe, expect, it } from "vitest";
import { detectCategory, formatPlate, isValidPlate, normalizePlate, plateFromQuery } from "./plate";

describe("normalizePlate", () => {
  it("uppercases and drops anything but letters, digits and the hyphen", () => {
    expect(normalizePlate(" abc-123 ")).toBe("ABC-123");
    expect(normalizePlate("ab.12 34")).toBe("AB1234");
  });
});

describe("formatPlate", () => {
  it.each([
    ["5881MB", "5881-MB"], // NNNN-LL (production 5881-MB: /query-plate rejected it without the hyphen)
    ["ab1234", "AB-1234"], // LL-NNNN
    ["12341A", "1234-1A"], // NNNN-NL
    ["A11234", "A1-1234"], // LN-NNNN (see the A11-234 ambiguity in detectCategory)
    ["abc123", "ABC-123"],
    ["A1B123", "A1B-123"],
  ])("adds the hyphen to %s → %s", (raw, expected) => {
    expect(formatPlate(raw)).toBe(expected);
  });

  it("keeps a typed hyphen and leaves an invalid plate as given", () => {
    expect(formatPlate("a11-234")).toBe("A11-234");
    expect(formatPlate("ABC12")).toBe("ABC12");
  });
});

describe("isValidPlate", () => {
  it.each(["ABC-123", "abc123", "1234-AB", "A1-1234"])("accepts %s", (plate) => {
    expect(isValidPlate(plate)).toBe(true);
  });

  it.each(["", "ABC-12", "ABCD-1234", "AB-12-34", "-ABC123", "ABC123-"])("rejects %j", (plate) => {
    expect(isValidPlate(plate)).toBe(false);
  });
});

// Spec 4.1: exactly one of the 4 moto patterns ⇒ moto; anything else ⇒ auto.
describe("detectCategory", () => {
  it.each([
    ["1234-AB", "NNNN-LL"],
    ["AB-1234", "LL-NNNN"],
    ["1234-1A", "NNNN-NL"],
    ["A1-1234", "LN-NNNN"],
  ])("detects a moto for %s (%s), with or without hyphen", (plate) => {
    expect(detectCategory(plate)).toBe("moto");
    expect(detectCategory(plate.replace("-", ""))).toBe("moto");
    expect(detectCategory(plate.toLowerCase())).toBe("moto");
  });

  it.each(["ABC-123", "abc123", "A1B-123", "C3P-456"])("detects an auto for %s", (plate) => {
    expect(detectCategory(plate)).toBe("auto");
  });

  it("uses the hyphen position when the user types it", () => {
    expect(detectCategory("A11-234")).toBe("auto");
  });

  // Pending decision (PENDIENTES.md): without hyphen this could also be the auto plate A11-234.
  it("treats the ambiguous compact plate A11234 as a moto, per the spec", () => {
    expect(detectCategory("A11234")).toBe("moto");
  });

  it("returns null while the plate is incomplete or invalid", () => {
    expect(detectCategory("")).toBeNull();
    expect(detectCategory("ABC-12")).toBeNull();
    expect(detectCategory("ABCD-1234")).toBeNull();
  });
});

describe("plateFromQuery", () => {
  it("takes a valid plate, normalized", () => {
    expect(plateFromQuery("abc-123")).toBe("ABC-123");
    expect(plateFromQuery(" abc123 ")).toBe("ABC123");
    expect(plateFromQuery(["7845-ia", "ABC-123"])).toBe("7845-IA");
  });

  it("ignores a missing or invalid plate", () => {
    expect(plateFromQuery(undefined)).toBeUndefined();
    expect(plateFromQuery("")).toBeUndefined();
    expect(plateFromQuery("ABC")).toBeUndefined();
    expect(plateFromQuery("ABC-1234")).toBeUndefined();
    expect(plateFromQuery("ABC_12345")).toBeUndefined();
  });
});
