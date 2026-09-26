import Image from "next/image";
import { cn } from "@/lib/cn";

type LogoProps = {
  /** `dark` on light backgrounds (header), `light` on brand backgrounds (footer). */
  tone?: "dark" | "light";
  className?: string;
};

// Figma "Layer_1" (160×53): symbol and wordmark are separate SVGs placed with these insets.
const SYMBOL_BOX = { top: 0, right: "64.69%", bottom: "0.41%", left: 0 };
const WORDMARK_BOX = { top: "9.33%", right: 0, bottom: "0.31%", left: "40.53%" };

export function Logo({ tone = "dark", className }: LogoProps) {
  return (
    <span role="img" aria-label="Camila Seguros" className={cn("relative inline-block aspect-160/53 w-40", className)}>
      <span className="absolute" style={SYMBOL_BOX}>
        <Image src="/brand/logo-symbol.svg" alt="" fill priority />
      </span>
      <span className="absolute" style={WORDMARK_BOX}>
        <Image
          src={tone === "dark" ? "/brand/logo-wordmark.svg" : "/brand/logo-wordmark-white.svg"}
          alt=""
          fill
          priority
        />
      </span>
    </span>
  );
}
