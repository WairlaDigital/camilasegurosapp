import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type RadioProps = Omit<ComponentProps<"input">, "type"> & {
  label: ReactNode;
};

// Figma: 22px ring with a 14px dot when selected ("¿Comprobante de pago…?" Sí / No).
export function Radio({ label, className, ...props }: RadioProps) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 text-body text-ink", className)}>
      <span className="relative grid shrink-0 place-items-center">
        <input
          type="radio"
          className="peer size-5.5 cursor-pointer appearance-none rounded-full border border-line bg-white transition-colors checked:border-brand-500"
          {...props}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute size-3.5 scale-0 rounded-full bg-brand-500 transition-transform peer-checked:scale-100"
        />
      </span>
      {label}
    </label>
  );
}
