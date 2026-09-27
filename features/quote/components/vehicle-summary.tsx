import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

type VehicleSummaryProps = {
  title: string;
  details: { label: string; value: string }[];
  editHref: string;
  className?: string;
};

/** Figma "Resumen del vehículo": icon tile, "BRAND MODEL YEAR", "Label: value" pairs and "Editar". */
export function VehicleSummary({ title, details, editHref, className }: VehicleSummaryProps) {
  return (
    <Card tone="outlined" className={cn("flex items-start gap-3", className)}>
      <span className="grid size-16 shrink-0 place-items-center rounded-tile bg-brand-500">
        <Image src="/icons/car.svg" alt="" width={52} height={24} />
      </span>
      <div className="flex flex-col gap-3 pt-1.5 md:gap-1 md:pt-0.5">
        <h2 className="text-body font-bold text-brand-500 uppercase md:font-medium">{title}</h2>
        <dl className="flex flex-col gap-2 md:flex-row md:flex-wrap md:gap-0 md:divide-x md:divide-line-soft">
          {details.map((detail) => (
            <div key={detail.label} className="flex gap-1 md:px-2.5 md:first:pl-0 md:last:pr-0">
              <dt className="text-brand-500">{detail.label}:</dt>
              <dd className="text-ink-strong">{detail.value}</dd>
            </div>
          ))}
        </dl>
        <Link href={editHref} className="inline-flex w-fit items-center gap-1.5 py-1 font-medium text-brand-500 hover:underline">
          <Image src="/icons/edit.svg" alt="" width={18} height={18} />
          Editar<span className="sr-only"> datos del vehículo</span>
        </Link>
      </div>
    </Card>
  );
}
