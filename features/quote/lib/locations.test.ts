import { describe, expect, it } from "vitest";
import { composeAddress, holderState, provinceFor } from "./locations";

describe("holderState", () => {
  it("recognizes Lima and Callao in any case, and nothing else", () => {
    expect(holderState("LIMA")).toBe("Lima");
    expect(holderState(" callao ")).toBe("Callao");
    expect(holderState("Arequipa")).toBeNull();
  });
});

describe("composeAddress", () => {
  it("joins the address, the reference and the province", () => {
    expect(composeAddress({ address: "Av. Primavera 1234", reference: "Urb. Los Álamos", province: provinceFor("Lima") })).toBe(
      "Av. Primavera 1234, Urb. Los Álamos, Lima",
    );
  });

  it("leaves out what is missing", () => {
    expect(composeAddress({ address: "Av. Primavera 1234", reference: undefined, province: provinceFor("Arequipa") })).toBe(
      "Av. Primavera 1234",
    );
  });
});
