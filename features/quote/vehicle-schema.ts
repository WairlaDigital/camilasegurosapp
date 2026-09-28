import { z } from "zod";
import type { VehicleTypeOption } from "@/types/quote";
import { allowedUses, isRucMotoLineal } from "./lib/use-matrix";
import type { DocumentType } from "./lib/vehicle-rules";

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

type VehicleRules = {
  /** Catalog types of the category fixed by the plate (`typesForCategory`). */
  types: VehicleTypeOption[];
  /** The holder's document: RUC changes the uses of a moto lineal (spec 4.2). */
  documentType: DocumentType;
};

export function parseVehicleForm(input: Record<string, unknown>, { types, documentType }: VehicleRules): VehicleParseResult {
  const result = vehicleSchema.safeParse(withoutEmpty(input));
  const errors: VehicleFieldErrors = {};

  if (!result.success) {
    const fieldErrors = z.flattenError(result.error).fieldErrors;
    for (const field of Object.keys(fieldErrors) as VehicleField[]) errors[field] = fieldErrors[field]?.[0];
  }

  // The type must match the plate's category and the use must be in the table
  // of spec section 2 and in the catalog (see use-matrix.ts).
  const type = types.find((option) => option.id === Number(input.typeId));
  if (input.typeId && !type) errors.typeId = "Selecciona el tipo de vehículo.";
  if (type && allowedUses(type, documentType).length === 0) {
    errors.useId = noUseMessage(type.id, documentType);
  } else if (type && input.useId && !allowedUses(type, documentType).some((use) => use.id === Number(input.useId))) {
    errors.useId = "Ese uso no aplica para este tipo de vehículo.";
  }
  if (errors.brandName && !errors.brandId) errors.brandId = errors.brandName;
  delete errors.brandName;

  if (result.success && Object.keys(errors).length === 0) return { ok: true, data: result.data };
  return { ok: false, errors };
}

/** Why a type has no use that can be quoted online. */
export function noUseMessage(typeId: number, documentType: DocumentType): string {
  return isRucMotoLineal(typeId, documentType)
    ? "Con RUC, una moto lineal solo puede tener uso Comercial, que aún no podemos cotizar en línea. Escríbenos y te ayudamos."
    : "Por ahora no podemos cotizar en línea este tipo de vehículo. Escríbenos y te ayudamos.";
}
