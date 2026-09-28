import type { PlateRegistration, VehicleCategory, VehicleTypeOption } from "@/types/quote";
import { noUseMessage } from "../vehicle-schema";
import { allowedUses, catalogTypeForClass, typeCategory } from "./use-matrix";
import { defaultQuoteRequest, VEHICLE_USES, type DocumentType, type VehicleUse } from "./vehicle-rules";

export const NOT_ONLINE = "Por ahora no podemos cotizar en línea este tipo de uso. Escríbenos y te ayudamos.";

/** Spec 4.1: the plate format fixes the category; the registration says otherwise. */
export const CATEGORY_MISMATCH: Record<VehicleCategory, string> = {
  auto: "Según el registro vehicular, esta placa es de una moto, mototaxi o trimoto, pero su formato es de auto. Revisa la placa o escríbenos y te ayudamos.",
  moto: "Según el registro vehicular, esta placa es de un auto, camioneta o camión, pero su formato es de moto. Revisa la placa o escríbenos y te ayudamos.",
};

export type QuoteRequestResult =
  | { ok: true; typeId: number; useId: number }
  /** `field: "use"` when the message belongs next to the use selector. */
  | { ok: false; message: string; field?: "use" };

type QuoteRequestInput = {
  category: VehicleCategory;
  use: VehicleUse;
  documentType: DocumentType;
  /** Null when the plate lookup found nothing or failed. */
  registration: PlateRegistration | null;
  types: VehicleTypeOption[];
};

/**
 * Type and use to quote the home form with. The registration's class gives the
 * real catalog type (a mototaxi is not quoted as a Motocicleta); the use must be
 * allowed for it (spec section 2 and 4.2). Without registration data, the
 * category's default type is used and the vehicle form lets the person fix it.
 */
export function quoteRequestFor({ category, use, documentType, registration, types }: QuoteRequestInput): QuoteRequestResult {
  const useId = VEHICLE_USES[use].apiId;
  if (useId === null) return { ok: false, message: NOT_ONLINE };

  if (registration?.category && registration.category !== category) {
    return { ok: false, message: CATEGORY_MISMATCH[category] };
  }

  const typeId = registration?.vehicleClass
    ? catalogTypeForClass(registration.vehicleClass.id, registration.seats)
    : null;
  const type = types.find((option) => option.id === typeId);

  if (type) {
    if (typeCategory(type.id) !== category) return { ok: false, message: CATEGORY_MISMATCH[category] };
    const uses = allowedUses(type, documentType);
    if (uses.length === 0) return { ok: false, field: "use", message: noUseMessage(type.id, documentType) };
    if (!uses.some((option) => option.id === useId)) {
      const choices = uses.map((option) => option.name).join(" o ");
      return {
        ok: false,
        field: "use",
        message: `Según el registro vehicular, tu vehículo es de tipo ${type.name}: el uso ${VEHICLE_USES[use].label} no aplica. Elige ${choices}.`,
      };
    }
    return { ok: true, typeId: type.id, useId };
  }

  const fallback = defaultQuoteRequest(category, use);
  return fallback ? { ok: true, ...fallback } : { ok: false, message: NOT_ONLINE };
}
