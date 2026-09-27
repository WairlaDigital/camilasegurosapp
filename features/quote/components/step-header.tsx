import Image from "next/image";
import Link from "next/link";
import { pillVariants } from "@/components/ui/pill";

type StepHeaderProps = {
  step: number;
  total: number;
  /** Where the back arrow goes (previous step). */
  backHref: string;
  title: string;
  plate?: string;
};

// Figma pattern "Encabezado de paso": step pill with back arrow, title and plate.
export function StepHeader({ step, total, backHref, title, plate }: StepHeaderProps) {
  return (
    <div className="flex flex-col items-start gap-4 lg:gap-5">
      <Link href={backHref} className={pillVariants({ tone: "step" })} aria-label={`Volver. Paso ${step} de ${total}`}>
        <Image src="/icons/step-back.svg" alt="" width={16} height={16} />
        Paso {step}/{total}
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-subtitle font-medium text-ink-strong lg:text-title">{title}</h1>
        {plate && <p className="text-body text-ink-strong uppercase lg:text-subtitle">Placa: {plate}</p>}
      </div>
    </div>
  );
}
