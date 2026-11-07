import Image from "next/image";
import { cn } from "@/lib/cn";

type LogoProps = {
  /** `dark` on light backgrounds (header), `light` on brand backgrounds (footer): sky symbol and white wordmark. */
  tone?: "dark" | "light";
  className?: string;
};

// Figma "Layer_1" (1014:158 header, 1014:934 footer), 169×62.
export function Logo({ tone = "dark", className }: LogoProps) {
  return (
    <Image
      src={tone === "dark" ? "/brand/logo.svg" : "/brand/logo-light.svg"}
      alt="Camila Seguros"
      width={169}
      height={62}
      // Only the header logo (dark) is above the fold; the footer one loads lazily.
      preload={tone === "dark"}
      className={cn("h-auto w-42.25", className)}
    />
  );
}
