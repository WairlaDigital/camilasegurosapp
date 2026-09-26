import type { ComponentProps, ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

export function Accordion({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2.5", className)} {...props} />;
}

type AccordionItemProps = Omit<ComponentProps<"details">, "title"> & {
  title: ReactNode;
  /** Items sharing a `name` behave as an exclusive group (one open at a time). */
  name?: string;
};

// Figma: FAQ "¿Quieres saber más?" (nodes 451:624, 454:628). Closed items are
// transparent over the section panel; the chevron does not rotate when open.
// Native <details>: no JS, keyboard accessible.
export function AccordionItem({ title, className, children, ...props }: AccordionItemProps) {
  return (
    <details
      className={cn(
        "rounded-card border border-line transition-colors open:border-brand-500 open:bg-brand-50",
        className,
      )}
      {...props}
    >
      <summary className="flex min-h-17.5 cursor-pointer list-none items-center justify-between gap-4 py-4 pr-7.5 pl-5 text-body font-medium text-ink md:pl-10 [&::-webkit-details-marker]:hidden">
        {title}
        <Image src="/icons/chevron-down.svg" alt="" width={15.5} height={8.5} className="shrink-0" />
      </summary>
      <div className="px-5 pb-13 text-body leading-relaxed font-medium text-ink md:pr-24 md:pl-10">
        {children}
      </div>
    </details>
  );
}
