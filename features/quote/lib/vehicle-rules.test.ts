import { describe, expect, it } from "vitest";
import { sanitizeDocumentNumber } from "./vehicle-rules";

describe("sanitizeDocumentNumber", () => {
  it("keeps digits only for DNI and RUC, up to their length", () => {
    expect(sanitizeDocumentNumber("DNI", "12a34-5678901")).toBe("12345678");
    expect(sanitizeDocumentNumber("RUC", "20 123 456 789 01")).toBe("20123456789");
  });

  it("keeps letters and digits in upper case for CE, up to 12", () => {
    expect(sanitizeDocumentNumber("CE", "ab-12.345 678901")).toBe("AB1234567890");
  });
});
