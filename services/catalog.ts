import "server-only";
import type { Option, VehicleTypeOption } from "@/types/quote";
import { apiRequest } from "./http";
import {
  dataResponseSchema,
  optionListSchema,
  toOptions,
  toStringOptions,
  toVehicleTypes,
} from "./schemas/catalog.schema";

const DAY = 60 * 60 * 24;

/** Vehicle types with their allowed uses (GET /data). */
export async function getVehicleTypes(): Promise<VehicleTypeOption[]> {
  return toVehicleTypes(await apiRequest("/data", dataResponseSchema, { revalidate: DAY }));
}

/** Brand search (GET /brands). Brand ids are local ids. */
export async function searchBrands(search: string, limit = 10): Promise<Option[]> {
  return toOptions(await apiRequest("/brands", optionListSchema, { searchParams: { search, limit }, revalidate: DAY }));
}

/** Models of a brand for a vehicle type (GET /models/{brand}/type/{type}). Ids are La Positiva ids. */
export async function getModels(brandId: number, typeId: number): Promise<Option<string>[]> {
  return toStringOptions(
    await apiRequest(`/models/${brandId}/type/${typeId}`, optionListSchema, { searchParams: { limit: 100 }, revalidate: DAY }),
  );
}

/** Versions of a model (GET /versions/{model}). Ids are La Positiva ids. */
export async function getVersions(modelId: string): Promise<Option<string>[]> {
  return toStringOptions(
    await apiRequest(`/versions/${encodeURIComponent(modelId)}`, optionListSchema, {
      searchParams: { limit: 100 },
      revalidate: DAY,
    }),
  );
}
