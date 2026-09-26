import type { ComponentProps } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { controlStyles, describedBy, FieldShell, type FieldProps } from "./field";

type SelectProps = Omit<ComponentProps<"select">, "name"> &
  FieldProps & {
    name: string;
    /** Disabled first option shown until the user picks a value (e.g. "Seleccione uso"). */
    placeholder?: string;
  };

export function Select({
  label,
  error,
  hint,
  variant = "stacked",
  id,
  name,
  placeholder,
  className,
  children,
  ...props
}: SelectProps) {
  const fieldId = id ?? name;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} variant={variant} className={className}>
      <div className="relative">
        <select
          id={fieldId}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, error, hint)}
          className={cn(
            controlStyles({ variant }),
            "cursor-pointer appearance-none pr-12 [&:has(option[value='']:checked)]:text-placeholder",
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <Image
          src="/icons/chevron-down.svg"
          alt=""
          width={15.5}
          height={8.5}
          className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2"
        />
      </div>
    </FieldShell>
  );
}
