import type { Holder } from "@/types/quote";

/**
 * Name for "Hola {name}": the first given name from RENIEC ("MARTÍN JAVIER" →
 * "Martín") or the company name from SUNAT as it comes. Null when unknown.
 */
export function greetingName(holder: Holder | null): string | null {
  const firstName = holder?.firstName?.trim().split(/\s+/)[0];
  if (firstName) return firstName.charAt(0).toLocaleUpperCase("es-PE") + firstName.slice(1).toLocaleLowerCase("es-PE");
  return holder?.companyName?.trim() || null;
}
