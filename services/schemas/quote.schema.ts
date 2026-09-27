import { z } from "zod";
import type { Option, QuoteResult, VehicleData } from "@/types/quote";

// POST /query-info response (see docs/api.md). Null keys are dropped by the backend.

const idSchema = z.union([z.number(), z.string()]);
const positivaSchema = z.object({ id: idSchema.nullish(), name: z.string().nullish() });
// Local model merged with La Positiva's data: { id?, name?, positiva: { id, name } }.
const mergedSchema = z
  .object({ id: idSchema.nullish(), name: z.string().nullish(), positiva: positivaSchema.nullish() })
  .nullish();

const vehicleSchema = z.object({
  plate: z.string(),
  year: z.number().nullish(),
  seats: z.number().nullish(),
  vin: z.string().nullish(),
  serial: z.string().nullish(),
  type: mergedSchema,
  use: mergedSchema,
  brand: mergedSchema,
  model: mergedSchema,
  version: mergedSchema,
});

const documentSchema = z.object({
  names: z.string().nullish(),
  last_name: z.string().nullish(),
  company_name: z.string().nullish(),
});

const planSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.coerce.number(), // soles as a decimal
  quote_token: z.string().nullish(),
  features: z.array(z.object({ name: z.string(), status: z.boolean() })).nullish(),
});

export const queryInfoResponseSchema = z.object({
  document: documentSchema.optional(),
  vehicle: vehicleSchema.optional(),
  plans: z.object({ featured: z.number().nullish(), plans: z.array(planSchema) }).optional(),
});

type Merged = z.infer<typeof mergedSchema>;

/** Local id when the backend matched a local record (brand), otherwise none. */
function localOption(value: Merged): Option | undefined {
  if (value?.id == null || !value.name) return undefined;
  return { id: Number(value.id), name: value.name };
}

/** La Positiva id (models and versions are sent back with these ids). */
function positivaOption(value: Merged): Option<string> | undefined {
  const id = value?.positiva?.id;
  const name = value?.positiva?.name ?? value?.name;
  if (id == null || id === "" || !name) return undefined;
  return { id: String(id), name };
}

const optional = <T>(value: T | null | undefined) => value ?? undefined;

/**
 * Plan names are "PRODUCT--Insurer--Vehicle type[--Use]", with uneven spacing
 * ("SOAT DIGITAL-- Positiva -- Automovil"). The card shows product and insurer.
 */
export function planDisplayName(name: string): { product: string; insurer: string } {
  const [product = name, insurer = ""] = name
    .split("--")
    .map((part) => part.trim().replace(/\s+/g, " "))
    .filter(Boolean);
  return { product, insurer: /positiva/i.test(insurer) ? "La Positiva" : insurer };
}

/** AFOCAT is not sold on seguroscamila.pe (spec), but the backend returns it in the same groups. */
export function isAfocatPlan(name: string): boolean {
  return planDisplayName(name).product.toUpperCase().startsWith("AFOCAT");
}

export function toQuoteResult(
  data: z.infer<typeof queryInfoResponseSchema>,
  request: { typeId: number; useId: number },
): QuoteResult {
  const vehicle: VehicleData | null = data.vehicle
    ? {
        plate: data.vehicle.plate,
        typeId: request.typeId,
        useId: request.useId,
        brand: localOption(data.vehicle.brand),
        model: positivaOption(data.vehicle.model),
        version: positivaOption(data.vehicle.version),
        year: optional(data.vehicle.year),
        seats: optional(data.vehicle.seats),
        serial: optional(data.vehicle.serial) || undefined,
        vin: optional(data.vehicle.vin) || undefined,
      }
    : null;

  const plans = (data.plans?.plans ?? [])
    .filter((plan) => !isAfocatPlan(plan.name))
    .map((plan) => ({
      id: plan.id,
      name: plan.name,
      ...planDisplayName(plan.name),
      priceCents: Math.round(plan.price * 100),
      quoteToken: plan.quote_token ?? null,
      features: (plan.features ?? []).map((feature) => ({ name: feature.name, included: feature.status })),
    }));
  const featured = data.plans?.featured ?? null;

  return {
    vehicle,
    holder: data.document
      ? {
          firstName: optional(data.document.names),
          lastName: optional(data.document.last_name),
          companyName: optional(data.document.company_name),
        }
      : null,
    plans,
    featuredPlanId: plans.some((plan) => plan.id === featured) ? featured : null,
  };
}

/** Same rule as the current front: every vehicle field is needed to quote La Positiva. */
export function isVehicleComplete(vehicle: VehicleData | null): boolean {
  return Boolean(
    vehicle?.brand && vehicle.model && vehicle.version && vehicle.year && vehicle.seats && vehicle.serial && vehicle.vin,
  );
}
