import { createHash } from "node:crypto";
import type { CreateOrderInput } from "@/types/checkout";
import { composeAddress, provinceFor } from "@/features/quote/lib/locations";
import { DOCUMENT_TYPES } from "@/features/quote/lib/vehicle-rules";
import type { QuoteSession } from "@/features/quote/session";

// Builds POST /data from the quote session. Everything comes from the session:
// the plan (and its quote token) from the API's quote, never from the browser.

export type OrderRequest =
  | { ok: true; input: Omit<CreateOrderInput, "orderId"> }
  | { ok: false; missing: "selection" | "holder" | "vehicle" };

export function buildOrderRequest(session: QuoteSession): OrderRequest {
  const { input, request, result, selection, holderDetails } = session;

  const plan = selection && result.plans.find((candidate) => candidate.id === selection.planId);
  if (!selection || !plan) return { ok: false, missing: "selection" };
  if (!holderDetails) return { ok: false, missing: "holder" };

  // The flow only reaches this point with a complete vehicle; checked again here.
  const vehicle = result.vehicle;
  if (!vehicle?.brand || !vehicle.model || !vehicle.version || !vehicle.year || !vehicle.seats || !vehicle.serial) {
    return { ok: false, missing: "vehicle" };
  }

  return {
    ok: true,
    input: {
      driver: {
        documentTypeId: DOCUMENT_TYPES[input.documentType].apiId,
        documentNumber: input.documentNumber,
        firstName: holderDetails.firstName,
        lastName: holderDetails.lastName,
        companyName: result.holder?.companyName,
        // POST /data has no field for the reference or the province: they go in the address text.
        address: composeAddress({
          address: holderDetails.address,
          reference: holderDetails.reference,
          province: provinceFor(holderDetails.state),
        }),
        state: holderDetails.state,
        district: holderDetails.district,
        phone: holderDetails.phone,
        email: holderDetails.email,
      },
      vehicle: {
        plate: input.plate.replace(/[^A-Z0-9]/gi, "").toUpperCase(), // the API only accepts letters and digits
        typeId: vehicle.typeId,
        useId: vehicle.useId,
        ubigeoId: request.ubigeoId,
        brandId: vehicle.brand.id,
        modelId: vehicle.model.id,
        versionId: vehicle.version.id,
        year: vehicle.year,
        seats: vehicle.seats,
        serial: vehicle.serial,
        vin: vehicle.vin,
      },
      plan: { id: plan.id, priceCents: plan.priceCents, quoteToken: plan.quoteToken },
      startDate: request.startDate,
    },
  };
}

/** Same order data ⇒ same fingerprint: the order already created can be reused. */
export function orderFingerprint(input: Omit<CreateOrderInput, "orderId">): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("base64url");
}
