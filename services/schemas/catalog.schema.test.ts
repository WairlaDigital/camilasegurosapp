import { describe, expect, it } from "vitest";
import { optionListSchema, toStringOptions, toVehicleTypes } from "./catalog.schema";

describe("toVehicleTypes", () => {
  it("sorts by order and drops types without uses (not quotable)", () => {
    const types = toVehicleTypes({
      types: [
        { id: 10, order: 8, name: "Motocicleta", uses: [{ id: 5, name: "Particular" }] },
        { id: 5, order: 100, name: "Camioneta rural", uses: [] },
        { id: 1, order: 0, name: "Automóvil", uses: [{ id: 1, name: "Taxi" }] },
      ],
    });
    expect(types.map((type) => type.id)).toEqual([1, 10]);
  });
});

describe("toStringOptions", () => {
  it("normalizes numeric and string ids to strings (models and versions differ)", () => {
    const data = optionListSchema.parse({ data: [{ id: 10006180, name: "1.3" }, { id: "1003272", name: "ACCENT" }] });
    expect(toStringOptions(data)).toEqual([
      { id: "10006180", name: "1.3" },
      { id: "1003272", name: "ACCENT" },
    ]);
  });
});
