import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

// Figma: "COMPRAR SOAT VIRTUAL" / "CONTÁCTANOS" (primary) and "LO QUIERO" (secondary).
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-center uppercase transition duration-150 ease-out active:scale-98 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-gradient-primary font-bold text-white shadow-cta hover:brightness-110",
        secondary: "bg-gradient-secondary font-extrabold text-brand-500 hover:brightness-105",
      },
      size: {
        lg: "h-15 px-15 text-small",
        md: "h-13 px-8 text-nav",
      },
      fullWidth: {
        true: "w-full px-6",
      },
    },
    defaultVariants: { variant: "primary", size: "lg" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Shows a spinner and blocks double submits. */
    pending?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  fullWidth,
  pending = false,
  disabled,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    >
      {pending && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
