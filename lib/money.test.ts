import { describe, expect, it } from "vitest";
import { formatMoney } from "./money";

describe("formatMoney", () => {
  it("formats cents as soles with a non-breaking space after the symbol", () => {
    expect(formatMoney(21000)).toBe("S/ 210.00");
    expect(formatMoney(8350)).toBe("S/ 83.50");
    expect(formatMoney(2200000)).toBe("S/ 22,000.00");
  });
});
