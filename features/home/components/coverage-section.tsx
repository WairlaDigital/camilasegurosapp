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
          <li key={coverage.title}>
            {/* TODO: coverage icons pending export from Figma (see PENDIENTES.md). */}
            <Card tone="brand-panel" padding="none" className="flex h-61.25 flex-col justify-end gap-2 p-7.5">
              <h3 className="text-body leading-tight font-bold">{coverage.title}</h3>
              <p className="text-small">{coverage.amount}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
