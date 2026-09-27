import { z } from "zod";
import type { Option, VehicleTypeOption } from "@/types/quote";

// GET /data (see docs/api.md). `groups` is ignored: plans come from /query-info.
export const dataResponseSchema = z.object({
  types: z.array(
    z.object({
      id: z.number(),
      order: z.number(),
      name: z.string(),
      uses: z.array(z.object({ id: z.number(), name: z.string() })),
    }),
  ),
});

export function toVehicleTypes(data: z.infer<typeof dataResponseSchema>): VehicleTypeOption[] {
  return data.types
    .filter((type) => type.uses.length > 0) // types without uses cannot be quoted
    .toSorted((a, b) => a.order - b.order)
    .map(({ id, name, uses }) => ({ id, name, uses }));
}

// GET /brands, /models/{brand}/type/{type}, /versions/{model}: { data: [{ id, name }] }.
// Model and version ids come as strings or numbers depending on the endpoint.
export const optionListSchema = z.object({
  data: z.array(z.object({ id: z.union([z.number(), z.string()]), name: z.string() })),
});

export function toOptions(data: z.infer<typeof optionListSchema>): Option[] {
  return data.data.map(({ id, name }) => ({ id: Number(id), name }));
}

export function toStringOptions(data: z.infer<typeof optionListSchema>): Option<string>[] {
  return data.data.map(({ id, name }) => ({ id: String(id), name }));
}
