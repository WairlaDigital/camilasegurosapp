import type { Option, VehicleCategory, VehicleTypeOption } from "@/types/quote";
import { VEHICLE_USES, type DocumentType, type VehicleUse } from "./vehicle-rules";

// Spec section 2: vehicle type → allowed uses. It is our own rule (validated on
// the client and in the Server Actions): a use is offered only if both this
// table and the API catalog (GET /data) allow it. Types outside the table
// ("Otros") follow the catalog.

type MatrixRow = { label: string; category: VehicleCategory; uses: readonly VehicleUse[] };

export const USE_MATRIX = {
  autoCamioneta: { label: "Auto / Camioneta", category: "auto", uses: ["particular", "taxi"] },
  camionFurgon: { label: "Camión / Furgón", category: "auto", uses: ["carga"] },
  motoLineal: { label: "Moto lineal", category: "moto", uses: ["particular", "comercial"] },
  mototaxi: { label: "Mototaxi", category: "moto", uses: ["particular", "taxi"] },
  trimoto: { label: "Trimoto", category: "moto", uses: ["carga"] },
} as const satisfies Record<string, MatrixRow>;

export type MatrixRowKey = keyof typeof USE_MATRIX;

/**
 * GET /data type ids for each row. Camión/Furgón has no type in the catalog yet,
 * and Trimoto = Motocarga (16) is PROVISIONAL until confirmed (PENDIENTES.md).
 */
const ROW_BY_TYPE_ID: Readonly<Record<number, MatrixRowKey>> = {
  1: "autoCamioneta", // Automóvil
  9: "autoCamioneta", // Station wagon
  25: "autoCamioneta", // Camioneta hasta 7 asientos
  27: "autoCamioneta", // Camioneta de 8 asientos
  10: "motoLineal", // Motocicleta
  2: "mototaxi", // Mototaxi
  16: "trimoto", // Motocarga
};

export function matrixRow(typeId: number): MatrixRowKey | null {
  return ROW_BY_TYPE_ID[typeId] ?? null;
}

/** Category of a catalog type. Types outside the table (minivans, buses, combis…) are autos. */
export function typeCategory(typeId: number): VehicleCategory {
  const row = matrixRow(typeId);
  return row ? USE_MATRIX[row].category : "auto";
}

/** Catalog types for the category fixed by the plate (spec 4.1: it cannot change). */
export function typesForCategory(types: VehicleTypeOption[], category: VehicleCategory): VehicleTypeOption[] {
  return types.filter((type) => typeCategory(type.id) === category);
}

/** Spec 4.2: with RUC, a moto lineal can only be "Comercial". */
export function isRucMotoLineal(typeId: number, documentType: DocumentType): boolean {
  return documentType === "RUC" && matrixRow(typeId) === "motoLineal";
}

/**
 * Uses offered for a catalog type: the table's uses (or only "Comercial" for
 * RUC + moto lineal) that the catalog also allows. A use without an API id
 * ("Comercial", pending with La Positiva) cannot be quoted yet, so it is left out.
 */
export function allowedUses(type: VehicleTypeOption, documentType: DocumentType): Option[] {
  const row = matrixRow(type.id);
  if (!row) return type.uses;
  const keys: readonly VehicleUse[] = isRucMotoLineal(type.id, documentType) ? ["comercial"] : USE_MATRIX[row].uses;
  const ids = keys.map((key) => VEHICLE_USES[key].apiId).filter((id) => id !== null);
  return type.uses.filter((use) => ids.some((id) => id === use.id));
}
