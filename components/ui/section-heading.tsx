import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Pill } from "./pill";

type SectionHeadingProps = {
  eyebrow: string;
  /** Wrap the key phrase in <strong> to get the bold emphasis from Figma. */
  children: ReactNode;
  id?: string;
  className?: string;
};

// Figma pattern: eyebrow pill + title with the key phrase in bold ("Conoce las **coberturas de tu SOAT**").
export function SectionHeading({ eyebrow, children, id, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col items-start gap-6", className)}>
      <Pill>{eyebrow}</Pill>
      <h2 id={id} className="text-subtitle font-medium text-ink-strong md:text-title [&_strong]:font-bold">
        {children}
      </h2>
    </div>
  );
}
