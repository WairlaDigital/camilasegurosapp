import { describe, expect, it } from "vitest";
import { limitPhone, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("keeps the digits and drops Peru's country code", () => {
    expect(normalizePhone("987 654 321")).toBe("987654321");
    expect(normalizePhone("+51 987654321")).toBe("987654321");
    expect(normalizePhone("51987654321")).toBe("987654321");
    expect(normalizePhone("519876543")).toBe("519876543"); // 9 digits: not a prefix
  });
});

describe("limitPhone", () => {
  it("keeps at most 9 digits after dropping the country code", () => {
    expect(limitPhone("98765432112")).toBe("987654321");
    expect(limitPhone("+51 987 654 321")).toBe("987654321");
    expect(limitPhone("9876")).toBe("9876");
  });
});
