// Plate rules from the spec (docs/flujo.md, "Categoría por placa").

export type VehicleCategory = "auto" | "moto";

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
