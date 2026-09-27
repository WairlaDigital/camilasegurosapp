import type { ReactNode } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";

/**
 * Two field layouts from Figma:
 * - `stacked`: bold label above the box (home form).
 * - `inset`: small label inside the box (vehicle, titular and date forms).
 */
export type FieldVariant = "stacked" | "inset";

export type FieldProps = {
  label: ReactNode;
  error?: string;
  hint?: string;
  variant?: FieldVariant;
};

export function describedBy(id: string, error?: string, hint?: string) {
  const ids = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export const controlStyles = cva(
  "h-14 w-full bg-white text-body font-semibold placeholder:font-semibold placeholder:text-placeholder disabled:cursor-not-allowed disabled:text-ink-muted",
  {
    variants: {
      variant: {
        stacked:
          "rounded-control border border-line px-5 text-ink focus:border-brand-500 disabled:bg-field-disabled aria-invalid:border-danger",
        inset: "rounded-control bg-transparent px-5 pt-5 text-ink-muted focus:outline-none",
      },
    },
  },
);

type FieldShellProps = FieldProps & {
  id: string;
  className?: string;
  children: ReactNode;
};

export function FieldShell({
  id,
  label,
  error,
  hint,
  variant = "stacked",
  className,
  children,
}: FieldShellProps) {
  const messages = (
    <>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-small text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-small font-semibold text-danger">
          {error}
        </p>
      )}
    </>
  );

  if (variant === "inset") {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <div className="group relative rounded-control border border-line bg-white focus-within:border-brand-500 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-500 has-aria-invalid:border-danger has-disabled:bg-field-disabled">
          <label
            htmlFor={id}
            className="pointer-events-none absolute top-2 left-5 text-small font-bold text-brand-500 group-has-disabled:text-brand-400"
          >
            {label}
          </label>
          {children}
        </div>
        {messages}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-label font-bold text-ink">
        {label}
      </label>
      {children}
      {messages}
    </div>
  );
}
