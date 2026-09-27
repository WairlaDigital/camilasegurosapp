import type { VehicleCategory } from "./plate";

// Vehicle uses (spec section 2). The API ids come from GET /data; "comercial"
// has no id yet (pending with La Positiva), so the UI works with keys and the
// id is resolved when the quote is sent.
export const VEHICLE_USES = {
  particular: { label: "Particular", apiId: 5 },
  taxi: { label: "Taxi", apiId: 1 },
  carga: { label: "Carga", apiId: 7 },
  comercial: { label: "Comercial", apiId: null },
} as const;

export type VehicleUse = keyof typeof VEHICLE_USES;
export const VEHICLE_USE_KEYS = Object.keys(VEHICLE_USES) as [VehicleUse, ...VehicleUse[]];

export const CATEGORIES: Record<VehicleCategory, { label: string }> = {
  auto: { label: "Autos, camionetas y camiones" },
  moto: { label: "Motos, mototaxis y trimotos" },
};
export const CATEGORY_KEYS: readonly VehicleCategory[] = ["auto", "moto"];

// Uses offered on the home form for each detected category. The exact vehicle
// type (e.g. moto lineal vs mototaxi) is only known after the plate lookup,
// where the finer rules apply (e.g. RUC + moto lineal ⇒ only Comercial).
export const USES_BY_CATEGORY: Record<VehicleCategory, readonly VehicleUse[]> = {
  auto: ["particular", "taxi", "carga"], // auto/camioneta: particular, taxi · camión/furgón: carga
  moto: ["particular", "taxi", "comercial", "carga"], // moto lineal, mototaxi, trimoto
};

// Document types offered by the spec (DNI, CE, RUC) with their API ids.
export const DOCUMENT_TYPES = {
  DNI: { label: "DNI", apiId: 1 },
  CE: { label: "CE", apiId: 3 },
  RUC: { label: "RUC", apiId: 2 },
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPES;
export const DOCUMENT_TYPE_KEYS = Object.keys(DOCUMENT_TYPES) as [DocumentType, ...DocumentType[]];

const DOCUMENT_RULES: Record<DocumentType, { pattern: RegExp; message: string; numeric: boolean }> = {
  DNI: { pattern: /^\d{8}$/, message: "El DNI tiene 8 dígitos.", numeric: true },
  CE: { pattern: /^[A-Z0-9]{6,12}$/, message: "Ingresa un carné de extranjería válido.", numeric: false },
  RUC: { pattern: /^(10|20)\d{9}$/, message: "El RUC tiene 11 dígitos y empieza con 10 o 20.", numeric: true },
};

export function documentRule(type: DocumentType) {
  return DOCUMENT_RULES[type];
}

// ── /query-info defaults ────────────────────────────────────────────────────
// The home form only knows the category (from the plate) and the use, but
// /query-info needs a vehicle type id and a circulation zone. Until the flow
// asks for them, these PROVISIONAL defaults are used (see PENDIENTES.md); the
// vehicle data screen lets the user pick the exact type from the catalog.

/** Default vehicle type id (GET /data) per category and use. Missing ⇒ not quotable online yet. */
const DEFAULT_TYPE_ID: Record<VehicleCategory, Partial<Record<VehicleUse, number>>> = {
  auto: { particular: 1, taxi: 1 }, // Automóvil. No "Camión/Furgón" type in the catalog for carga.
  moto: { particular: 10, taxi: 2, carga: 16 }, // Motocicleta, Mototaxi, Motocarga. "Comercial" has no use id.
};

/** Lima. PROVISIONAL until the zone question is decided. */
export const DEFAULT_UBIGEO_ID = "150101";

export function defaultQuoteRequest(category: VehicleCategory, use: VehicleUse): { typeId: number; useId: number } | null {
  const typeId = DEFAULT_TYPE_ID[category][use];
  const useId = VEHICLE_USES[use].apiId;
  return typeId !== undefined && useId !== null ? { typeId, useId } : null;
}
