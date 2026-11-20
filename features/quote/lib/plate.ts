// Plate rules from the spec (docs/flujo.md, "Categoría por placa").

import type { VehicleCategory } from "@/types/quote";

export type { VehicleCategory };

/** Uppercases and strips spaces; keeps the hyphen if the user typed it. */
export function normalizePlate(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

/** A Peruvian plate: 6 letters/digits, with an optional hyphen between them. */
export function isValidPlate(raw: string): boolean {
  const plate = normalizePlate(raw);
  return /^[A-Z0-9]{6}$/.test(plate.replace("-", "")) && /^[A-Z0-9]+-?[A-Z0-9]+$/.test(plate);
}

// Moto / mototaxi / trimoto: exactly one of these 4 patterns (L = letter, N = digit).
const MOTO_WITH_HYPHEN = [
  /^\d{4}-[A-Z]{2}$/, // NNNN-LL
  /^[A-Z]{2}-\d{4}$/, // LL-NNNN
  /^\d{4}-\d[A-Z]$/, // NNNN-NL
  /^[A-Z]\d-\d{4}$/, // LN-NNNN
];
const MOTO_COMPACT = [/^\d{4}[A-Z]{2}$/, /^[A-Z]{2}\d{4}$/, /^\d{5}[A-Z]$/, /^[A-Z]\d{5}$/];

/**
 * Category detected from the plate, or null while the plate is incomplete.
 * Anything that is not a moto pattern is an auto (spec 4.1).
 *
 * Without a hyphen, "A11234" matches LN-NNNN (moto) but could also be the auto
 * plate A11-234: pending decision, see PENDIENTES.md.
 */
export function detectCategory(raw: string): VehicleCategory | null {
  if (!isValidPlate(raw)) return null;
  const plate = normalizePlate(raw);
  const patterns = plate.includes("-") ? MOTO_WITH_HYPHEN : MOTO_COMPACT;
  return patterns.some((pattern) => pattern.test(plate)) ? "moto" : "auto";
}

/**
 * The plate as the API expects it, with its hyphen ("5881MB" → "5881-MB"): POST
 * /query-plate rejects a plate without it (422), and the lookup is what applies
 * the rules of the real vehicle type. A typed hyphen is kept; a moto takes the
 * hyphen of its pattern and an auto goes 3-3. Invalid plates come back as given.
 */
export function formatPlate(raw: string): string {
  const plate = normalizePlate(raw);
  if (!isValidPlate(plate) || plate.includes("-")) return plate;
  if (detectCategory(plate) === "auto") return `${plate.slice(0, 3)}-${plate.slice(3)}`;
  // Moto: NNNN-LL and NNNN-NL start with 4 digits; LL-NNNN and LN-NNNN with 2 characters.
  return /^\d{4}/.test(plate) ? `${plate.slice(0, 4)}-${plate.slice(4)}` : `${plate.slice(0, 2)}-${plate.slice(2)}`;
}

/**
 * Plate from the home URL (`/?plate=ABC-123`, e.g. a link from another site or a
 * campaign) to prefill the form. Only a valid plate is taken; anything else is ignored.
 */
export function plateFromQuery(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const plate = normalizePlate(raw);
  return isValidPlate(plate) ? plate : undefined;
}
