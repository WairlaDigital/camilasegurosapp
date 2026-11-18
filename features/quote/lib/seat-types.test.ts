import { describe, expect, it } from "vitest";
import { typeIdForSeats } from "./seat-types";

// Class 33 in production: "Camioneta hasta 7 asientos" (25) and "Camioneta de 8 asientos" (27).
const camionetas = [
  { id: 25, name: "Camioneta hasta 7 asientos", maxSeats: 7 },
  { id: 27, name: "Camioneta de 8 asientos", minSeats: 8 },
];

describe("typeIdForSeats", () => {
  it("picks the type whose range includes the seats", () => {
    expect(typeIdForSeats(camionetas, 5)).toBe(25);
    expect(typeIdForSeats(camionetas, 7)).toBe(25);
    expect(typeIdForSeats(camionetas, 8)).toBe(27);
    expect(typeIdForSeats(camionetas, 9)).toBe(27);
  });

  it("has no type for invalid seats or when no range fits", () => {
    expect(typeIdForSeats(camionetas, 0)).toBeNull();
    expect(typeIdForSeats(camionetas, Number.NaN)).toBeNull();
    expect(typeIdForSeats([{ id: 25, name: "Camioneta hasta 7 asientos", maxSeats: 7 }], 8)).toBeNull();
  });
});
