import { z } from "zod";
import { badRequest, parseQuery, upstreamFailed } from "@/features/quote/lib/catalog-route";
import { getModels } from "@/services/catalog";

const querySchema = z.object({
  brandId: z.coerce.number().int().positive(),
  typeId: z.coerce.number().int().positive(),
});

export async function GET(request: Request) {
  const query = parseQuery(request, querySchema);
  if (!query) return badRequest();
  try {
    return Response.json({ data: await getModels(query.brandId, query.typeId) });
  } catch (error) {
    return upstreamFailed("GET /api/vehicles/models", error);
  }
}
