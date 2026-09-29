import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter } from "./rate-limit";

function clock(start = 0) {
  let time = start;
  return { now: () => time, advance: (ms: number) => (time += ms) };
}

let counter = 0;
const uniqueName = () => `test-${counter++}`;

describe("createRateLimiter", () => {
  it("allows `limit` requests per window and says when to retry", () => {
    const { now, advance } = clock();
    const check = createRateLimiter({ name: uniqueName(), limit: 2, windowMs: 60_000, now });

    expect(check("a")).toEqual({ ok: true });
    expect(check("a")).toEqual({ ok: true });
    advance(15_000);
    expect(check("a")).toEqual({ ok: false, retryAfterSeconds: 45 });
    expect(check("b")).toEqual({ ok: true }); // keys are independent

    advance(45_000);
    expect(check("a")).toEqual({ ok: true }); // new window
  });

  it("shares counts between limiters with the same name (one per bundle in Next)", () => {
    const { now } = clock();
    const name = uniqueName();
    const first = createRateLimiter({ name, limit: 1, windowMs: 1000, now });
    const second = createRateLimiter({ name, limit: 1, windowMs: 1000, now });

    expect(first("a")).toEqual({ ok: true });
    expect(second("a")).toMatchObject({ ok: false });
  });
});

describe("clientIp", () => {
  it("uses the first x-forwarded-for address, then x-real-ip", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "190.1.2.3, 10.0.0.1" }))).toBe("190.1.2.3");
    expect(clientIp(new Headers({ "x-real-ip": "190.4.5.6" }))).toBe("190.4.5.6");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
