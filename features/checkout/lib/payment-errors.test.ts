import { describe, expect, it } from "vitest";
import { startDateError } from "./payment-errors";

describe("startDateError", () => {
  it("lets the payment go on from the quoted day onwards", () => {
    expect(startDateError("2026-10-03", "2026-10-03")).toBeNull();
    expect(startDateError("2026-10-10", "2026-10-03")).toBeNull();
  });

  it("sends the person to pick another date once the start date passed", () => {
    expect(startDateError("2026-10-02", "2026-10-03")).toMatchObject({
      ok: false,
      link: { href: "/cotizar/cotizacion", label: "Elegir otra fecha" },
    });
  });
});
