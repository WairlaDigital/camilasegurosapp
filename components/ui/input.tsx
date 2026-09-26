import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { controlStyles, describedBy, FieldShell, type FieldProps } from "./field";

type InputProps = Omit<ComponentProps<"input">, "name"> &
  FieldProps & {
    /** Also used as the element id unless `id` is given. */
    name: string;
  };

export function Input({
  label,
  error,
  hint,
  variant = "stacked",
  id,
  name,
  className,
  ...props
}: InputProps) {
  const fieldId = id ?? name;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} variant={variant} className={className}>
      <input
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        className={cn(controlStyles({ variant }))}
        {...props}
      />
    </FieldShell>
  );
}
