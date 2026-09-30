import { z } from "zod";
import type { ChargeResult, PaymentOrder } from "@/types/checkout";

// POST /data (create the order) and POST /charge responses (see docs/api.md).

/** POST /data: the pending policy id and the Culqi Checkout settings. */
export const createOrderResponseSchema = z.object({
  order_id: z.number(),
  culqi: z.object({
    // `price * 100` in PHP: may come as a float (3350.0000000001) or a string.
    amount: z.coerce.number().positive(),
    title: z.string(),
    currency: z.enum(["PEN", "USD"]),
    order: z.string().min(1),
  }),
});

export function toPaymentOrder(data: z.infer<typeof createOrderResponseSchema>): PaymentOrder {
  return {
    orderId: data.order_id,
    culqi: {
      title: data.culqi.title,
      currency: data.culqi.currency,
      amount: Math.round(data.culqi.amount),
      order: data.culqi.order,
    },
  };
}

/**
 * POST /charge: always HTTP 200. `data` carries Culqi's reason on errors, sometimes
 * as a JSON string; the front never shows it (it may be a raw exception message).
 */
export const chargeResponseSchema = z.object({
  status: z.enum(["success", "error"]),
  data: z.unknown().optional(),
});

export function toChargeResult(data: z.infer<typeof chargeResponseSchema>): ChargeResult {
  return data.status === "success" ? { ok: true } : { ok: false };
}
