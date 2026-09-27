import Image from "next/image";
import { Pill } from "@/components/ui/pill";
import { heroBenefits } from "../content";

// Hero copy (Figma node 197:420 and 438:506). The panel photo is rendered by HomeHeroBackdrop.
export function HomeHero() {
  return (
    <div className="flex min-h-112.5 flex-col items-start justify-end gap-3 px-5 pt-10 pb-25 text-white lg:min-h-150 lg:justify-start lg:gap-6 lg:px-0 lg:pt-31.5 lg:pb-0">
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
      {/* Figma mobile hides the benefits. */}
      <ul className="hidden grid-cols-2 gap-y-4.5 lg:mt-5.5 lg:grid lg:w-143.5">
        {heroBenefits.map((benefit) => (
          <li key={benefit.label} className="flex items-center gap-2.5 text-body font-medium">
            {/* Figma: icons left-aligned, label always 58px from the icon's left edge. */}
            <span className="flex w-12 shrink-0 justify-start">
              <Image src={benefit.icon.src} alt="" width={benefit.icon.width} height={benefit.icon.height} />
            </span>
            {benefit.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

// The photo is 1420×600 (exported at 2x). On narrow panels it is cropped to keep
// the driver in view, as in the Figma mobile frame.
const PHOTO_POSITION = { objectPosition: "62% 50%" };

/** Rounded wide panel with the hero photo and the violet veil behind the copy. */
export function HomeHeroBackdrop() {
  return (
    <div aria-hidden className="absolute inset-x-5 top-0 h-112.5 overflow-hidden rounded-panel bg-brand-900 lg:h-150">
      <Image
        src="/images/hero-banner.jpg"
        alt=""
        fill
        preload
        sizes="(min-width: 1460px) 1420px, 100vw"
        className="object-cover"
        style={PHOTO_POSITION}
      />
      {/* Veil measured on the Figma exports: violet on the copy side, fading into the photo. */}
      <div className="absolute inset-0 bg-linear-to-tr from-brand-500/85 via-brand-500/45 via-45% to-brand-900/20 lg:bg-linear-to-r lg:from-brand-500/85 lg:via-brand-500/45 lg:via-35% lg:to-transparent lg:to-60%" />
    </div>
  );
}
