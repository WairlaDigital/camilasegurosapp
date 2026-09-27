import Image from "next/image";
import { Pill } from "@/components/ui/pill";
import { heroBenefits } from "../content";

// Hero copy (Figma node 197:420 and 438:506). The panel photo is rendered by HomeHeroBackdrop.
export function HomeHero() {
  return (
    <div className="flex min-h-112.5 flex-col items-start justify-center gap-6 px-5 py-12 text-white lg:min-h-150 lg:justify-start lg:px-0 lg:pt-31.5">
      <Pill tone="light">
        Seguros \ SOAT
        <Image src="/icons/chevron-right.svg" alt="" width={7.5} height={13.5} />
      </Pill>
      <h1 className="max-w-md text-title font-medium md:text-display">
        SOAT al Instante: Cómpralo <strong className="font-bold">100% online</strong>
      </h1>
      <p className="max-w-lg text-body">
        Desde S/33 al año. Recíbelo inmediatamente en tu Whatsapp y correo electrónico. Sin colas, sin papeleos.
      </p>
      {/* TODO: benefit icons pending export from Figma (see PENDIENTES.md). */}
      <ul className="mt-4 grid grid-cols-2 gap-x-10 gap-y-6 text-small font-medium">
        {heroBenefits.map((benefit) => (
          <li key={benefit}>{benefit}</li>
        ))}
      </ul>
    </div>
  );
}

/** Rounded wide panel behind the hero copy. */
export function HomeHeroBackdrop() {
  return (
    <div aria-hidden className="absolute inset-x-5 top-0 h-112.5 overflow-hidden rounded-panel bg-gradient-primary lg:h-150">
      {/* TODO: hero photo pending export from Figma (see PENDIENTES.md). */}
      <div className="absolute inset-0 bg-linear-to-r from-brand-900/60 to-transparent" />
    </div>
  );
}
