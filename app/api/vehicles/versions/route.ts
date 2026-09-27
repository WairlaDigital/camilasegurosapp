import { z } from "zod";
import { badRequest, parseQuery, upstreamFailed } from "@/features/quote/lib/catalog-route";
import { getVersions } from "@/services/catalog";

const querySchema = z.object({ modelId: z.string().regex(/^\d{1,12}$/) });

export async function GET(request: Request) {
  const query = parseQuery(request, querySchema);
  if (!query) return badRequest();
  try {
    return Response.json({ data: await getVersions(query.modelId) });
  } catch (error) {
    return upstreamFailed("GET /api/vehicles/versions", error);
  }
}
