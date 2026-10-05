// Holder address (decision 2026-10-05): only Lima and Callao, as soatparataxi.pe.
// POST /data receives the department and district as text and has no field for
// the province or the reference: both go inside the address text.

export const HOLDER_STATES = ["Lima", "Callao"] as const;
export type HolderState = (typeof HOLDER_STATES)[number];

/** Each department's only province offered (Lima Metropolitana and the Constitutional Province of Callao). */
export const PROVINCE_BY_STATE: Record<HolderState, string> = { Lima: "Lima", Callao: "Callao" };

export const DISTRICTS: Record<HolderState, readonly string[]> = {
  Lima: [
    "Lima",
    "Ancón",
    "Ate",
    "Barranco",
    "Breña",
    "Carabayllo",
    "Chaclacayo",
    "Chorrillos",
    "Cieneguilla",
    "Comas",
    "El Agustino",
    "Independencia",
    "Jesús María",
    "La Molina",
    "La Victoria",
    "Lince",
    "Los Olivos",
    "Lurigancho",
    "Lurín",
    "Magdalena del Mar",
    "Miraflores",
    "Pachacámac",
    "Pucusana",
    "Pueblo Libre",
    "Puente Piedra",
    "Punta Hermosa",
    "Punta Negra",
    "Rímac",
    "San Bartolo",
    "San Borja",
    "San Isidro",
    "San Juan de Lurigancho",
    "San Juan de Miraflores",
    "San Luis",
    "San Martín de Porres",
    "San Miguel",
    "Santa Anita",
    "Santa María del Mar",
    "Santa Rosa",
    "Santiago de Surco",
    "Surquillo",
    "Villa El Salvador",
    "Villa María del Triunfo",
  ],
  Callao: ["Bellavista", "Callao", "Carmen de la Legua Reynoso", "La Perla", "La Punta", "Ventanilla"],
};

/** "LIMA" (as SUNAT returns it) → "Lima". Null for any other department. */
export function holderState(value: string): HolderState | null {
  const normalized = value.trim().toLocaleLowerCase("es-PE");
  return HOLDER_STATES.find((state) => state.toLocaleLowerCase("es-PE") === normalized) ?? null;
}

export function provinceFor(state: string): string | undefined {
  const known = holderState(state);
  return known ? PROVINCE_BY_STATE[known] : undefined;
}

/** Address text for POST /data: "Av. Primavera 1234, Urb. Los Álamos, Lima". */
export function composeAddress(parts: { address: string; reference?: string; province?: string }): string {
  return [parts.address, parts.reference, parts.province].filter((part) => part?.trim()).join(", ");
}
