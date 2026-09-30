"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/services/errors";
import { chargeOrder, createOrder } from "@/services/checkout";
import type { CulqiSettings } from "@/types/checkout";
import { limitCheckout, sessionKey, TOO_MANY_REQUESTS } from "@/features/quote/lib/limits";
import { readQuoteSession, writeQuoteSession } from "@/features/quote/session";
import { buildOrderRequest, orderFingerprint } from "./lib/order-request";

export type StartPaymentResult =
  | { ok: true; data: { settings: CulqiSettings; email: string } }
  | { ok: false; error: string };

/** Only failures come back: a successful charge redirects to the confirmation. */
export type ChargePaymentResult = { ok: false; error: string };

const SESSION_EXPIRED = "Tu sesión expiró. Vuelve a ingresar tu placa para cotizar.";

/** Fields POST /data may reject (422) with a message the person can act on. */
function orderErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === "VALIDATION") {
    const fields = Object.keys(error.fieldErrors ?? {});
    if (fields.includes("driver.email")) {
      return "No pudimos validar tu correo electrónico. Vuelve al inicio y escribe otro correo.";
    }
    if (fields.includes("driver.phone")) {
      return "Revisa tu número de celular en la cotización e inténtalo de nuevo.";
    }
    return "Revisa tus datos e inténtalo de nuevo. Si el problema sigue, escríbenos y te ayudamos.";
  }
  // An expired or invalid quote is a 500 in the backend (PENDIENTES.md).
  return "No pudimos generar tu orden de pago. Si pasó un rato desde que cotizaste, vuelve a cotizar e inténtalo de nuevo.";
}

/**
 * "Continuar con el pago": creates the order (POST /data) and returns what Culqi
 * Checkout opens with. The same order data reuses the order already created, so
 * a retry never creates a second one.
 */
export async function startPayment(): Promise<StartPaymentResult> {
  const session = await readQuoteSession();
  if (!session) return { ok: false, error: SESSION_EXPIRED };
  if (session.order?.status === "paid") redirect("/cotizar/confirmacion");

  const request = buildOrderRequest(session);
  if (!request.ok) {
    redirect(request.missing === "holder" ? "/cotizar/titular" : "/cotizar/cotizacion");
  }

  if (!limitCheckout(sessionKey(session)).ok) return { ok: false, error: TOO_MANY_REQUESTS };

  const fingerprint = orderFingerprint(request.input);
  const previous = session.order?.fingerprint === fingerprint ? session.order : undefined;

  let order;
  try {
    order = await createOrder({ ...request.input, orderId: previous?.id });
  } catch (error) {
    console.error("startPayment: POST /data failed", error);
    return { ok: false, error: orderErrorMessage(error) };
  }

  await writeQuoteSession({
    ...session,
    order: { id: order.orderId, fingerprint, status: previous?.status ?? "created" },
  });
  return { ok: true, data: { settings: order.culqi, email: session.input.email } };
}

// Culqi.token as the browser receives it: only what POST /charge reads.
const tokenSchema = z.object({ id: z.string().min(15).max(30), email: z.string().max(254) });

/**
 * Charges the session's order with the token Culqi Checkout returned (card or
 * Yape). The order comes from the session, never from the browser.
 */
export async function chargePayment(token: unknown): Promise<ChargePaymentResult> {
  const parsedToken = tokenSchema.safeParse(token);
  if (!parsedToken.success) {
    return { ok: false, error: "No pudimos leer los datos de tu pago. Inténtalo de nuevo." };
  }

  const session = await readQuoteSession();
  if (!session) return { ok: false, error: SESSION_EXPIRED };
  const { order } = session;
  if (order?.status === "paid") redirect("/cotizar/confirmacion");
  if (!order) return { ok: false, error: "Tu orden de pago no está lista. Presiona «Continuar con el pago» de nuevo." };

  if (!limitCheckout(sessionKey(session)).ok) return { ok: false, error: TOO_MANY_REQUESTS };

  let result;
  try {
    result = await chargeOrder(order.id, { id: parsedToken.data.id, email: parsedToken.data.email });
  } catch (error) {
    console.error("chargePayment: POST /charge failed", error);
    // The charge may have gone through before the connection failed.
    return {
      ok: false,
      error:
        "No pudimos confirmar tu pago. Antes de volver a intentarlo, revisa si te llegó un correo de confirmación o un cargo en tu cuenta.",
    };
  }

  if (!result.ok) {
    // Culqi's reason is not shown: the backend may send a raw exception message.
    return {
      ok: false,
      error: "No pudimos procesar tu pago. Revisa los datos de tu tarjeta o prueba con otro medio de pago.",
    };
  }

  await writeQuoteSession({ ...session, order: { ...order, status: "paid" } });
  redirect("/cotizar/confirmacion");
}

/**
 * Culqi generated a deferred payment code (banca móvil, agentes, billeteras) for
 * the order. The payment is confirmed later by Culqi's webhook to the API.
 */
export async function markOrderPending(): Promise<void> {
  const session = await readQuoteSession();
  if (session?.order?.status === "created") {
    await writeQuoteSession({ ...session, order: { ...session.order, status: "pending" } });
  }
  redirect("/cotizar/confirmacion");
}
