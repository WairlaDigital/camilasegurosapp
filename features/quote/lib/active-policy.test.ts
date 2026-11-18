import { describe, expect, it } from "vitest";
import { activePolicyHref, expiryFromQuery } from "./active-policy";

describe("activePolicyHref", () => {
  it("carries the expiry date when known", () => {
    expect(activePolicyHref("2027-10-05")).toBe("/cotizar/soat-vigente?vence=2027-10-05");
    expect(activePolicyHref(undefined)).toBe("/cotizar/soat-vigente");
  });
});

describe("expiryFromQuery", () => {
  it("takes a real YYYY-MM-DD date", () => {
    expect(expiryFromQuery("2027-10-05")).toBe("2027-10-05");
    expect(expiryFromQuery(["2027-10-05", "2028-01-01"])).toBe("2027-10-05");
  });

  it("ignores anything else", () => {
    expect(expiryFromQuery(undefined)).toBeUndefined();
    expect(expiryFromQuery("05/10/2027")).toBeUndefined();
    expect(expiryFromQuery("2027-02-31")).toBeUndefined();
    expect(expiryFromQuery("2027-10-05<x>")).toBeUndefined();
  });
});
