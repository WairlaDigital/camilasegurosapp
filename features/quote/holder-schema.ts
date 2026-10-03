import { z } from "zod";
import type { Holder } from "@/types/quote";

// Holder data for the order (POST /data), shared by the form and the Server Action.
// The backend requires first and last names (letters and spaces only, even with
// RUC), address, department and district (stored as text; the policy's location
// comes from the circulation zone).

/** Peru's 24 departments plus the Constitutional Province of Callao. */
export const DEPARTMENTS = [
  "Amazonas",
  "Áncash",
  "Apurímac",
  "Arequipa",
  "Ayacucho",
  "Cajamarca",
  "Callao",
  "Cusco",
  "Huancavelica",
  "Huánuco",
  "Ica",
  "Junín",
  "La Libertad",
  "Lambayeque",
  "Lima",
  "Loreto",
  "Madre de Dios",
  "Moquegua",
  "Pasco",
  "Piura",
  "Puno",
  "San Martín",
  "Tacna",
  "Tumbes",
  "Ucayali",
] as const;

const NAME = /^[\p{L}\p{M}\s]+$/u; // same rule as the backend

/** Shared by the schema and the inputs' maxLength. */
export const HOLDER_MAX_LENGTH = { firstName: 60, lastName: 60, address: 150, district: 60 } as const;
const PLACE = /^[\p{L}\p{M}\s'.-]+$/u;

const name = (missing: string) =>
  z
    .string({ error: missing })
    .trim()
    .min(1, missing)
    .min(2, "Debe tener al menos 2 letras.")
    .max(HOLDER_MAX_LENGTH.firstName, `Máximo ${HOLDER_MAX_LENGTH.firstName} caracteres.`)
    .regex(NAME, "Solo letras y espacios.");

const holderSchema = z.object({
  firstName: name("Ingresa los nombres."),
  lastName: name("Ingresa los apellidos."),
  address: z
    .string({ error: "Ingresa tu domicilio." })
    .trim()
    .min(1, "Ingresa tu domicilio.")
    .min(5, "Escribe la dirección completa (calle y número).")
    .max(HOLDER_MAX_LENGTH.address, `Máximo ${HOLDER_MAX_LENGTH.address} caracteres.`),
  state: z.string({ error: "Selecciona el departamento." }).trim().min(1, "Selecciona el departamento."),
  district: z
    .string({ error: "Ingresa el distrito." })
    .trim()
    .min(1, "Ingresa el distrito.")
    .min(2, "Ingresa el distrito.")
    .max(HOLDER_MAX_LENGTH.district, `Máximo ${HOLDER_MAX_LENGTH.district} caracteres.`)
    .regex(PLACE, "Solo letras y espacios."),
});

export type HolderFormValues = z.output<typeof holderSchema>;
export type HolderField = keyof HolderFormValues;
export type HolderFieldErrors = Partial<Record<HolderField, string>>;

export type HolderParseResult = { ok: true; data: HolderFormValues } | { ok: false; errors: HolderFieldErrors };

export const HOLDER_FIELDS: HolderField[] = ["firstName", "lastName", "address", "state", "district"];

/**
 * Values the API already returned for the holder. They are shown locked and
 * always win over what the form sends.
 */
export function lockedHolderFields(holder: Holder | null): Partial<HolderFormValues> {
  const locked: Partial<HolderFormValues> = {};
  if (holder?.firstName) locked.firstName = holder.firstName;
  if (holder?.lastName) locked.lastName = holder.lastName;
  if (holder?.address) locked.address = holder.address;
  if (holder?.state) locked.state = holder.state;
  if (holder?.district) locked.district = holder.district;
  return locked;
}

export function parseHolderForm(input: Record<string, unknown>, locked: Partial<HolderFormValues>): HolderParseResult {
  const result = holderSchema.safeParse({ ...input, ...locked });
  const errors: HolderFieldErrors = {};

  if (!result.success) {
    const fieldErrors = z.flattenError(result.error).fieldErrors;
    for (const field of Object.keys(fieldErrors) as HolderField[]) errors[field] = fieldErrors[field]?.[0];
  }

  // A department typed by hand must be one of the list; one from the API is kept as it comes.
  const state = String(input.state ?? "").trim();
  if (!locked.state && state && !DEPARTMENTS.some((department) => department === state)) {
    errors.state = "Selecciona el departamento.";
  }

  if (result.success && Object.keys(errors).length === 0) return { ok: true, data: result.data };
  return { ok: false, errors };
}
