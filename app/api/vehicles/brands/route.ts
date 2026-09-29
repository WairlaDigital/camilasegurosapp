import { z } from "zod";
import { badRequest, guardCatalogRequest, parseQuery, upstreamFailed } from "@/features/quote/lib/catalog-route";
import { searchBrands } from "@/services/catalog";

// Brand search for the vehicle form (the API token must stay on the server).
const querySchema = z.object({ search: z.string().trim().min(2).max(40) });

export async function GET(request: Request) {
  const denied = await guardCatalogRequest();
  if (denied) return denied;
  const query = parseQuery(request, querySchema);
  if (!query) return badRequest();
  try {
    return Response.json({ data: await searchBrands(query.search) });
  } catch (error) {
    return upstreamFailed("GET /api/vehicles/brands", error);
  }
}
