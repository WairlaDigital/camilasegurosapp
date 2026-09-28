import "server-only";
import type { PlateRegistration, QuoteResult } from "@/types/quote";
import { ApiError, apiRequest } from "./http";
import {
  plateLookupResponseSchema,
  queryInfoResponseSchema,
  toPlateRegistration,
  toQuoteResult,
} from "./schemas/quote.schema";

export { isVehicleComplete } from "./schemas/quote.schema";

export type QueryInfoInput = {
  documentType: number; // API document type id
  documentNumber: string;
  plate: string;
  typeId: number;
  useId: number;
  ubigeoId: string;
  startDate?: string; // YYYY-MM-DD
  /** Manual vehicle data: the backend requires all of it or none. */
  manual?: {
    brandId: number;
    modelId: string;
    versionId: string;
    seats: number;
    year: number;
    serial: string;
    vin: string;
  };
};

/**
 * Looks up the plate and the holder's document and quotes the plans (POST /query-info).
 * Every call creates a new quote in the backend: call it once per step, not on every render.
 */
export async function queryInfo(input: QueryInfoInput): Promise<QuoteResult> {
  const data = await apiRequest("/query-info", queryInfoResponseSchema, {
    method: "POST",
    timeoutMs: 30_000, // plate, RENIEC/SUNAT and La Positiva lookups
    body: {
      document_type: input.documentType,
      document_number: input.documentNumber,
      plate: input.plate,
      type_id: input.typeId,
      use_id: input.useId,
      ubigeo_id: input.ubigeoId,
      start_date: input.startDate,
      ...(input.manual && {
        brand_id: input.manual.brandId,
        model_id: Number(input.manual.modelId),
        version_id: Number(input.manual.versionId),
        seats: input.manual.seats,
        year: input.manual.year,
        serial: input.manual.serial,
        vin: input.manual.vin,
      }),
    },
  });
  return toQuoteResult(data, { typeId: input.typeId, useId: input.useId });
}

/**
 * Vehicle registration for a plate (POST /query-plate): read-only, it creates no
 * quote. Null when the lookup finds nothing (404).
 */
export async function lookupPlate(plate: string): Promise<PlateRegistration | null> {
  try {
    const data = await apiRequest("/query-plate", plateLookupResponseSchema, {
      method: "POST",
      timeoutMs: 20_000,
      body: { plate },
    });
    return toPlateRegistration(data);
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") return null;
    throw error;
  }
}
