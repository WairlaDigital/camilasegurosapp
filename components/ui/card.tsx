import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

// Figma: form panel (surface), vehicle summary (outlined), plan and coverage cards (brand).
export const cardVariants = cva("", {
  variants: {
    tone: {
      surface: "rounded-card bg-white",
      outlined: "rounded-card border border-line-soft bg-white",
      brand: "rounded-card bg-brand-500 text-white",
      "brand-panel": "rounded-panel bg-brand-500 text-white",
    },
    padding: {
      none: "",
      md: "p-5",
      lg: "p-5 md:p-10",
    },
  },
  defaultVariants: { tone: "surface", padding: "md" },
});

type CardProps = ComponentProps<"div"> & VariantProps<typeof cardVariants>;

export function Card({ tone, padding, className, ...props }: CardProps) {
  return <div className={cn(cardVariants({ tone, padding }), className)} {...props} />;
}
