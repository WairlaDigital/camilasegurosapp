import Image from "next/image";
import Link from "next/link";
import { pillVariants } from "@/components/ui/pill";

type StepBackLinkProps = {
  step: number;
  total: number;
  /** Where the back arrow goes (previous step). */
  href: string;
};

/** Step pill with back arrow ("PASO n/total"). */
export function StepBackLink({ step, total, href }: StepBackLinkProps) {
  return (
    <Link href={href} className={pillVariants({ tone: "step" })} aria-label={`Volver. Paso ${step} de ${total}`}>
      <Image src="/icons/step-back.svg" alt="" width={16} height={16} />
      Paso {step}/{total}
    </Link>
  );
}

type StepHeaderProps = {
  step: number;
  total: number;
  /** Where the back arrow goes (previous step). */
  backHref: string;
  title: string;
  /** Line under the title ("Contrátalo hoy…"). */
  description?: string;
  plate?: string;
};

// Figma pattern "Encabezado de paso": step pill with back arrow, title and plate or description.
export function StepHeader({ step, total, backHref, title, description, plate }: StepHeaderProps) {
  return (
    <div className="flex flex-col items-start gap-4 lg:gap-5">
      <StepBackLink step={step} total={total} href={backHref} />
      <div className="flex flex-col gap-2">
        <h1 className="text-subtitle font-medium text-ink-strong lg:text-title">{title}</h1>
        {description && <p className="text-body text-ink-strong lg:text-subtitle">{description}</p>}
        {plate && <p className="text-body text-ink-strong uppercase lg:text-subtitle">Placa: {plate}</p>}
      </div>
    </div>
  );
}
