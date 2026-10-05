import type { PlanSummary, QuoteResult } from "@/types/quote";

/** What the plan cards need (the quote token stays on the server), featured plan first. */
export function planSummaries(result: Pick<QuoteResult, "plans" | "featuredPlanId">): PlanSummary[] {
  const plans = result.plans.map(({ id, product, insurer, priceCents, features }) => ({
    id,
    product,
    insurer,
    priceCents,
    features,
  }));
  const featured = plans.findIndex((plan) => plan.id === result.featuredPlanId);
  if (featured > 0) plans.unshift(...plans.splice(featured, 1));
  return plans;
}
