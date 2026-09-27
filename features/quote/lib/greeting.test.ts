import { describe, expect, it } from "vitest";
import { greetingName } from "./greeting";

describe("greetingName", () => {
  it("uses the first given name in title case", () => {
    expect(greetingName({ firstName: "MARTÍN JAVIER", lastName: "RODRIGUEZ" })).toBe("Martín");
    expect(greetingName({ firstName: "  ÑUSTA " })).toBe("Ñusta");
  });

  it("falls back to the company name (RUC)", () => {
    expect(greetingName({ companyName: "TRANSPORTES LIMA S.A.C." })).toBe("TRANSPORTES LIMA S.A.C.");
  });

  it("returns null when the document lookup gave no name", () => {
    expect(greetingName(null)).toBeNull();
    expect(greetingName({ firstName: " " })).toBeNull();
  });
});
