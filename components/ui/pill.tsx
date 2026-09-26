import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

// Figma: "Coberturas" (brand), "SEGUROS \ SOAT" on the hero (light), "PASO 3/3" (step).
export const pillVariants = cva(
  "inline-flex w-fit items-center rounded-full border font-semibold leading-none whitespace-nowrap",
  {
    variants: {
      tone: {
        brand: "gap-2 border-brand-900 px-5 py-2.5 text-body text-brand-900",
        light: "gap-5 border-white px-5 py-2.5 text-caption text-white uppercase",
        step: "gap-2 border-brand-500 px-3.5 py-2 text-caption text-brand-500 uppercase",
      },
    },
    defaultVariants: { tone: "brand" },
  },
);

type PillProps = ComponentProps<"span"> & VariantProps<typeof pillVariants>;

export function Pill({ tone, className, ...props }: PillProps) {
  return <span className={cn(pillVariants({ tone }), className)} {...props} />;
}
