import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CheckboxProps = Omit<ComponentProps<"input">, "type" | "name"> & {
  name: string;
  label: ReactNode;
  error?: string;
};

// Figma: 22px box, radius 5, border #cacaca (consent checkbox on the home form).
export function Checkbox({ id, name, label, error, className, ...props }: CheckboxProps) {
  const fieldId = id ?? name;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={fieldId} className="flex cursor-pointer items-start gap-3 text-small font-bold text-ink">
        <span className="relative grid shrink-0 place-items-center">
          <input
            type="checkbox"
            id={fieldId}
            name={name}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className="peer size-5.5 cursor-pointer appearance-none rounded-check border border-line bg-white transition-colors checked:border-brand-500 checked:bg-brand-500 aria-invalid:border-danger"
            {...props}
          />
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute hidden size-3.5 text-white peer-checked:block"
          >
            <path d="M3 8.5l3.5 3.5L13 4.5" />
          </svg>
        </span>
        <span className="pt-0.5">{label}</span>
      </label>
      {error && (
        <p id={`${fieldId}-error`} className="text-small font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
