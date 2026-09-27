import { describe, expect, it } from "vitest";
import { addDays, formatDate, todayInLima } from "./dates";

describe("todayInLima", () => {
  it("uses Peru's date, not UTC (Lima is UTC-5)", () => {
    expect(todayInLima(new Date("2026-09-28T03:00:00Z"))).toBe("2026-09-27");
    expect(todayInLima(new Date("2026-09-28T05:00:00Z"))).toBe("2026-09-28");
  });
});

describe("addDays", () => {
  it("crosses month and year ends", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-09-27", 365)).toBe("2027-09-27");
  });
});

describe("formatDate", () => {
  it("shows the date as day/month/year", () => {
    expect(formatDate("2026-03-01")).toBe("01/03/2026");
  });
});
