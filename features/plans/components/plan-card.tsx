import type { ReactNode } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import type { PlanSummary } from "@/types/quote";

type PlanCardProps = {
  plan: PlanSummary;
  /** The "LO QUIERO" action. */
  children: ReactNode;
  selected?: boolean;
  className?: string;
};

/** Figma "Tarjeta de plan" (240:117): insurer, yearly price, action and features. */
export function PlanCard({ plan, children, selected = false, className }: PlanCardProps) {
  return (
    <Card
      tone="brand"
      padding="none"
      className={cn(
        "relative isolate flex flex-col overflow-hidden bg-gradient-plan px-7.5 pt-22 pb-12 transition-shadow duration-200 lg:pb-20",
        selected && "ring-4 ring-brand-200",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-1 left-1/2 -z-10 -translate-x-1/2 text-watermark font-bold text-outline select-none"
      >
        SOAT
      </span>

      <h3 className="flex flex-col text-subtitle">
        <span className="font-bold">{plan.product}</span>
        {plan.insurer && <span className="font-medium">{plan.insurer}</span>}
      </h3>
      <p className="mt-2 text-title">{formatMoney(plan.priceCents)}</p>
      <p className="mt-3 w-fit bg-brand-900 px-2 py-1 text-body font-medium text-brand-200">Pago Anual</p>

      <div className="mt-7">{children}</div>

      {plan.features.length > 0 && (
        <ul className="mt-8 flex flex-col gap-1.5" aria-label="Coberturas del plan">
          {plan.features.map((feature) => (
            <li key={feature.name} className="flex items-center justify-between gap-3 pl-2.5">
              <span className={cn("flex gap-2.5", !feature.included && "text-brand-200 line-through")}>
                <span aria-hidden>•</span>
                {feature.name}
              </span>
              {feature.included ? (
                <Image src="/icons/check-circle.svg" alt="Incluido" width={19} height={20} className="shrink-0" />
              ) : (
                <span className="sr-only">No incluido</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
