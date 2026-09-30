import { describe, expect, it } from "vitest";
import { chargeResponseSchema, createOrderResponseSchema, toChargeResult, toPaymentOrder } from "./checkout.schema";

describe("POST /data", () => {
  it("maps the order and rounds the amount PHP computed as price * 100", () => {
    const data = createOrderResponseSchema.parse({
      culqi: { amount: 8350.000000000001, title: "SOAT--La Positiva--Automóvil", currency: "PEN", order: "ord_test_abc" },
      order_id: 42,
    });
    expect(toPaymentOrder(data)).toEqual({
      orderId: 42,
      culqi: { amount: 8350, title: "SOAT--La Positiva--Automóvil", currency: "PEN", order: "ord_test_abc" },
    });
  });

  it("rejects a response without the Culqi order", () => {
    const result = createOrderResponseSchema.safeParse({
      culqi: { amount: 21000, title: "SOAT", currency: "PEN", order: null },
      order_id: 42,
    });
    expect(result.success).toBe(false);
  });
});

describe("POST /charge", () => {
  it("is ok only with status success", () => {
    expect(toChargeResult(chargeResponseSchema.parse({ status: "success" }))).toEqual({ ok: true });
    expect(
      toChargeResult(chargeResponseSchema.parse({ status: "error", data: { user_message: "Tarjeta rechazada" } })),
    ).toEqual({ ok: false });
    // The backend sometimes sends `data` as a JSON string.
    expect(toChargeResult(chargeResponseSchema.parse({ status: "error", data: '{"user_message":"x"}' }))).toEqual({
      ok: false,
    });
  });
});
