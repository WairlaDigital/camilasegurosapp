import { z } from "zod";
import type { Holder } from "@/types/quote";
import { DISTRICTS, holderState } from "./lib/locations";
import { normalizePhone } from "./lib/phone";
import { EMAIL_MAX_LENGTH } from "./schema";

// "Completa los datos del titular" (step 1/3), shared by the form and the Server
// Action. Names come from /query-info and the address goes to POST /data, which
// requires first and last names (letters and spaces only, even with RUC),
// address, department and district.

const NAME = /^[\p{L}\p{M}\s]+$/u; // same rule as the backend

/** Shared by the schema and the inputs' maxLength. */
export const HOLDER_MAX_LENGTH = { firstName: 60, lastName: 60, address: 150, reference: 80 } as const;

const name = (missing: string, max: number) =>
  z
    .string({ error: missing })
    .trim()
    .min(1, missing)
    .min(2, "Debe tener al menos 2 letras.")
    .max(max, `Máximo ${max} caracteres.`)
    .regex(NAME, "Solo letras y espacios.");

const holderSchema = z.object({
  firstName: name("Ingresa los nombres.", HOLDER_MAX_LENGTH.firstName),
  lastName: name("Ingresa los apellidos.", HOLDER_MAX_LENGTH.lastName),
  address: z
    .string({ error: "Ingresa tu domicilio." })
    .trim()
    .min(1, "Ingresa tu domicilio.")
    .min(5, "Escribe la dirección completa (calle y número).")
    .max(HOLDER_MAX_LENGTH.address, `Máximo ${HOLDER_MAX_LENGTH.address} caracteres.`),
  // Optional: it is added to the address text (POST /data has no field for it).
  reference: z
    .string()
    .trim()
    .max(HOLDER_MAX_LENGTH.reference, `Máximo ${HOLDER_MAX_LENGTH.reference} caracteres.`)
    .optional()
    .transform((value) => value || undefined),
  state: z.string({ error: "Selecciona el departamento." }).trim().min(1, "Selecciona el departamento."),
  district: z.string({ error: "Selecciona el distrito." }).trim().min(1, "Selecciona el distrito."),
  email: z
    .email({ error: "Ingresa un correo válido." })
    .max(EMAIL_MAX_LENGTH, "Ingresa un correo válido."),
  phone: z
    .string({ error: "Ingresa tu número de celular." })
    .transform(normalizePhone)
    .pipe(z.string().regex(/^9\d{8}$/, "Ingresa un celular de 9 dígitos que empiece con 9.")),
});

export type HolderFormValues = z.output<typeof holderSchema>;
export type HolderField = keyof HolderFormValues;
export type HolderFieldErrors = Partial<Record<HolderField, string>>;

export type HolderParseResult = { ok: true; data: HolderFormValues } | { ok: false; errors: HolderFieldErrors };

export const HOLDER_FIELDS: HolderField[] = [
  "firstName",
  "lastName",
  "address",
  "reference",
  "state",
  "district",
  "email",
  "phone",
];

/** Fields the API may already have returned for the holder (RENIEC for DNI/CE, SUNAT for RUC). */
export type LockableHolderField = "firstName" | "lastName" | "address" | "state" | "district";

/**
 * Values the API already returned for the holder. They are shown locked and
 * always win over what the form sends.
 */
export function lockedHolderFields(holder: Holder | null): Partial<Pick<HolderFormValues, LockableHolderField>> {
  const locked: Partial<Pick<HolderFormValues, LockableHolderField>> = {};
  if (holder?.firstName) locked.firstName = holder.firstName;
  if (holder?.lastName) locked.lastName = holder.lastName;
  if (holder?.address) locked.address = holder.address;
  if (holder?.state) locked.state = holder.state;
  if (holder?.district) locked.district = holder.district;
  return locked;
}

export function parseHolderForm(
  input: Record<string, unknown>,
  locked: Partial<Pick<HolderFormValues, LockableHolderField>>,
): HolderParseResult {
  const result = holderSchema.safeParse({ ...input, ...locked });
  const errors: HolderFieldErrors = {};

  if (!result.success) {
    const fieldErrors = z.flattenError(result.error).fieldErrors;
    for (const field of Object.keys(fieldErrors) as HolderField[]) errors[field] = fieldErrors[field]?.[0];
  }

  // Lima and Callao only, with their district lists. A department or district
  // returned by the API (SUNAT, RUC) is kept as it comes.
  const state = String(locked.state ?? input.state ?? "").trim();
  const known = holderState(state);
  if (!locked.state && state && !known) errors.state = "Selecciona el departamento.";
  const district = String(input.district ?? "").trim();
  if (!locked.district && known && district && !DISTRICTS[known].includes(district)) {
    errors.district = "Selecciona el distrito.";
  }

  if (result.success && Object.keys(errors).length === 0) return { ok: true, data: result.data };
  return { ok: false, errors };
}
