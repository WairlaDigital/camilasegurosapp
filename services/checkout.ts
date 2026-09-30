import "server-only";
import type { ChargeResult, CreateOrderInput, PaymentOrder } from "@/types/checkout";
import { apiRequest } from "./http";
import {
  chargeResponseSchema,
  createOrderResponseSchema,
  toChargeResult,
  toPaymentOrder,
} from "./schemas/checkout.schema";

/**
 * Creates the pending policy and its Culqi order (POST /data). With `orderId` the
 * API reuses that policy and Culqi order instead of creating new ones. With a
 * quote token the API charges the saved quote's price: the price sent is ignored.
 */
export async function createOrder(input: CreateOrderInput): Promise<PaymentOrder> {
  const { driver, vehicle, plan } = input;
  const data = await apiRequest("/data", createOrderResponseSchema, {
    method: "POST",
    timeoutMs: 30_000, // creates the Culqi order
    // The backend reads every key below directly: a missing one is a 500, so optional
    // values are sent as null instead of being left out.
    body: {
      reseller: null,
      order_id: input.orderId ?? null,
      driver: {
        id: null,
        document_type: driver.documentTypeId,
        document_number: driver.documentNumber,
        first_name: driver.firstName,
        last_name: driver.lastName,
        company_name: driver.companyName ?? null,
        address: driver.address,
        phone: driver.phone,
        email: driver.email,
        state: driver.state,
        district: driver.district,
        country_code: "PE",
      },
      vehicle: {
        plate: vehicle.plate,
        type_id: vehicle.typeId,
        use_id: vehicle.useId,
        color: null,
        seats: vehicle.seats,
        year_built: vehicle.year,
        serial: vehicle.serial,
        vin: vehicle.vin ?? null,
        ubigeo_id: vehicle.ubigeoId,
        brand: vehicle.brandId,
        model: Number(vehicle.modelId),
        version: Number(vehicle.versionId),
      },
      plan: { id: plan.id, price: plan.priceCents / 100, token: plan.quoteToken },
      delivery: { date: input.startDate },
      is_renewable: false,
      accept_terms: true,
    },
  });
  return toPaymentOrder(data);
}

/** Charges an order with the token Culqi Checkout returned (card or Yape). */
export async function chargeOrder(orderId: number, token: { id: string; email: string }): Promise<ChargeResult> {
  const data = await apiRequest("/charge", chargeResponseSchema, {
    method: "POST",
    timeoutMs: 45_000, // Culqi charge
    body: { token, order: orderId },
  });
  return toChargeResult(data);
}
