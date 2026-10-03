import { z } from "zod";
import { detectCategory, normalizePlate } from "./lib/plate";
import {
  DOCUMENT_TYPE_KEYS,
  documentRule,
  USES_BY_CATEGORY,
  VEHICLE_USE_KEYS,
  type DocumentType,
  type VehicleUse,
} from "./lib/vehicle-rules";

// Shared by the form (validation on blur/submit) and the Server Action.

/** RFC 5321 limit; also the input's maxLength. */
export const EMAIL_MAX_LENGTH = 254;

const baseSchema = z.object({
  plate: z
    .string({ error: "Ingresa tu placa." })
    .trim()
    .min(1, "Ingresa tu placa.")
    .transform(normalizePlate)
    .refine((plate) => detectCategory(plate) !== null, "Ingresa una placa válida de 6 caracteres (ej. ABC-123)."),
  documentType: z.enum(DOCUMENT_TYPE_KEYS, { error: "Elige el tipo de documento." }),
  documentNumber: z
    .string({ error: "Ingresa tu número de documento." })
    .trim()
    .toUpperCase()
    .min(1, "Ingresa tu número de documento."),
  use: z.enum(VEHICLE_USE_KEYS, { error: "Selecciona el uso de tu vehículo." }),
  email: z.email({ error: "Ingresa un correo válido." }).max(EMAIL_MAX_LENGTH, "Ingresa un correo válido."),
  consent: z.literal("on", { error: "Debes aceptar el consentimiento para continuar." }),
});

export type StartQuoteValues = z.output<typeof baseSchema>;
export type StartQuoteField = keyof StartQuoteValues;
export type FieldErrors = Partial<Record<StartQuoteField, string>>;

export type ParseResult = { ok: true; data: StartQuoteValues } | { ok: false; errors: FieldErrors };

/**
 * Validates the home form. Cross-field rules (document number by type, use by
 * plate category) run even when other fields fail, so every error shows at once.
 */
export function parseStartQuote(input: Record<string, unknown>): ParseResult {
  const errors: FieldErrors = {};
  const result = baseSchema.safeParse(input);

  if (!result.success) {
    const fieldErrors = z.flattenError(result.error).fieldErrors;
    for (const field of Object.keys(fieldErrors) as StartQuoteField[]) {
      errors[field] = fieldErrors[field]?.[0];
    }
  }

  const documentType = DOCUMENT_TYPE_KEYS.find((type) => type === input.documentType);
  const documentNumber = String(input.documentNumber ?? "").trim().toUpperCase();
  if (documentType && documentNumber && !errors.documentNumber) {
    const rule = documentRule(documentType);
    if (!rule.pattern.test(documentNumber)) errors.documentNumber = rule.message;
  }

  const category = detectCategory(String(input.plate ?? ""));
  const use = VEHICLE_USE_KEYS.find((key) => key === input.use);
  if (category && use && !USES_BY_CATEGORY[category].includes(use)) {
    errors.use = "Ese uso no aplica para este tipo de vehículo.";
  }

  if (result.success && Object.keys(errors).length === 0) return { ok: true, data: result.data };
  return { ok: false, errors };
}

export type { DocumentType, VehicleUse };
