import { z } from "zod";
import type { VehicleTypeOption } from "@/types/quote";

// Vehicle data form (spec section 6). Shared by the form and the Server Action.
// The backend needs every field when data is entered by hand (see docs/api.md).

const MIN_YEAR = 1980;
const maxYear = () => new Date().getFullYear() + 1;

const requiredNumber = (message: string) => z.coerce.number({ error: message }).int(message).positive(message);

const vehicleSchema = z.object({
  useId: requiredNumber("Selecciona el tipo de uso."),
  typeId: requiredNumber("Selecciona el tipo de vehículo."),
  brandId: requiredNumber("Busca y elige la marca de la lista."),
  brandName: z.string({ error: "Busca y elige la marca de la lista." }).trim().min(1, "Busca y elige la marca de la lista."),
  modelId: z.string({ error: "Selecciona el modelo." }).regex(/^\d+$/, "Selecciona el modelo."),
  modelName: z.string().trim().default(""),
  versionId: z.string({ error: "Selecciona la versión." }).regex(/^\d+$/, "Selecciona la versión."),
  versionName: z.string().trim().default(""),
  seats: z.coerce
    .number({ error: "Ingresa el número de asientos." })
    .int("Ingresa un número entero.")
    .min(1, "Debe ser entre 1 y 99.")
    .max(99, "Debe ser entre 1 y 99."),
  year: z.coerce
    .number({ error: "Ingresa el año de fabricación." })
    .int("Ingresa un año válido.")
    .min(MIN_YEAR, `Debe ser entre ${MIN_YEAR} y ${maxYear()}.`)
    .max(maxYear(), `Debe ser entre ${MIN_YEAR} y ${maxYear()}.`),
  serial: z
    .string({ error: "Ingresa el número de serie." })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{8,20}$/, "Ingresa el número de serie (8 a 20 letras o números)."),
  vin: z
    .string({ error: "Ingresa el VIN." })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{8,20}$/, "Ingresa el VIN (8 a 20 letras o números)."),
});

export type VehicleFormValues = z.output<typeof vehicleSchema>;
export type VehicleField = keyof VehicleFormValues;
export type VehicleFieldErrors = Partial<Record<VehicleField, string>>;

export type VehicleParseResult = { ok: true; data: VehicleFormValues } | { ok: false; errors: VehicleFieldErrors };

// Empty inputs arrive as "" and would coerce to 0: treat them as missing.
function withoutEmpty(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== ""));
}

export function parseVehicleForm(input: Record<string, unknown>, types: VehicleTypeOption[]): VehicleParseResult {
  const result = vehicleSchema.safeParse(withoutEmpty(input));
  const errors: VehicleFieldErrors = {};

  if (!result.success) {
    const fieldErrors = z.flattenError(result.error).fieldErrors;
    for (const field of Object.keys(fieldErrors) as VehicleField[]) errors[field] = fieldErrors[field]?.[0];
  }

  // The use must be one the catalog allows for the chosen type (spec section 2).
  const type = types.find((option) => option.id === Number(input.typeId));
  if (input.typeId && !type) errors.typeId = "Selecciona el tipo de vehículo.";
  if (type && input.useId && !type.uses.some((use) => use.id === Number(input.useId))) {
    errors.useId = "Ese uso no aplica para este tipo de vehículo.";
  }
  if (errors.brandName && !errors.brandId) errors.brandId = errors.brandName;
  delete errors.brandName;

  if (result.success && Object.keys(errors).length === 0) return { ok: true, data: result.data };
  return { ok: false, errors };
}
