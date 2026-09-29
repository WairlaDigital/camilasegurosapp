import { z } from "zod";
import type { Option, PlateRegistration, QuoteResult, VehicleCategory, VehicleData } from "@/types/quote";

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
  category: mergedSchema,
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
  address: z.string().nullish(),
  state: z.string().nullish(),
  district: z.string().nullish(),
});

/** Blank strings from the lookup count as missing. */
const text = (value: string | null | undefined) => value?.trim() || undefined;

const planSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.coerce.number(), // soles as a decimal
  quote_token: z.string().nullish(),
  features: z.array(z.object({ name: z.string(), status: z.boolean() })).nullish(),
});

/** POST /query-plate: the plate lookup alone (no quote), wrapped by Laravel in `data`. */
export const plateLookupResponseSchema = z.object({ data: vehicleSchema });

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
 * Category of the registration found by the plate lookup (La Positiva's
 * IdCategoria / Descripcion, the MTC classes): L1–L5 are motos, mototaxis and
 * trimotos; M, N and O are cars, buses, trucks and trailers. Without lookup data
 * the backend echoes the category of the type we sent, so it never contradicts it.
 */
function registeredCategory(value: Merged): VehicleCategory | undefined {
  const name = value?.positiva?.name?.trim().toUpperCase() ?? "";
  if (/^L\d/.test(name)) return "moto";
  if (/^[MNO]\d/.test(name)) return "auto";
  const id = Number(value?.positiva?.id);
  if (id >= 1 && id <= 5) return "moto";
  if (id >= 6 && id <= 15) return "auto";
  return undefined;
}

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
        registeredCategory: registeredCategory(data.vehicle.category),
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
          firstName: text(data.document.names),
          lastName: text(data.document.last_name),
          companyName: text(data.document.company_name),
          address: text(data.document.address),
          state: text(data.document.state),
          district: text(data.document.district),
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

/** Registration data used to pick the catalog type before quoting. */
export function toPlateRegistration(data: z.infer<typeof plateLookupResponseSchema>): PlateRegistration {
  const vehicle = data.data;
  const classId = Number(vehicle.type?.positiva?.id);
  const className = vehicle.type?.positiva?.name;
  return {
    category: registeredCategory(vehicle.category),
    vehicleClass: classId > 0 && className ? { id: classId, name: className } : undefined,
    seats: optional(vehicle.seats),
  };
}
