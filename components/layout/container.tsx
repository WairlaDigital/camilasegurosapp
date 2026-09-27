import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type ContainerProps = ComponentProps<"div"> & {
  /** `content` (1120px) for text and forms, `wide` (1420px + gutters) for hero, sections and footer. */
  width?: "content" | "wide";
};

export function Container({ width = "content", className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5",
        width === "content" ? "max-w-content xl:px-0" : "max-w-wide",
        className,
      )}
      {...props}
    />
  );
}
