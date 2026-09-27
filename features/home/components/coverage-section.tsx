import Image from "next/image";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { coverages } from "../content";

// Figma "Conoce las coberturas de tu SOAT": 256×245 brand panels, 2 columns.
export function CoverageSection() {
  return (
    <section aria-labelledby="coverages-title" className="flex flex-col gap-9 lg:gap-14">
      <SectionHeading eyebrow="Coberturas" id="coverages-title">
        Conoce las <strong>coberturas de tu SOAT</strong>
      </SectionHeading>
      <ul className="grid grid-cols-2 gap-2 sm:max-w-136 sm:gap-x-8 sm:gap-y-5">
        {coverages.map((coverage) => (
          <li key={coverage.titleLines.join(" ")}>
            {/* Figma: icons of any height end on the same line (81px mobile / 91px desktop
                from the top) and the title starts right below; empty space stays at the bottom. */}
            <Card tone="brand-panel" padding="none" className="flex h-61.25 flex-col px-7.5">
              <span className="flex h-20.25 shrink-0 items-end lg:h-22.75">
                <Image src={coverage.icon.src} alt="" width={coverage.icon.width} height={coverage.icon.height} />
              </span>
              <h3 className="mt-3 text-body leading-snug font-bold lg:mt-5.75">
                {coverage.titleLines[0]}
                <br className="hidden lg:inline" /> {coverage.titleLines[1]}
              </h3>
              <p className="mt-1.5 text-small">{coverage.amount}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
