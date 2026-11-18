import Image from "next/image";
import { Pill } from "@/components/ui/pill";
import { heroBenefits } from "../content";

// Hero copy (Figma desktop 197:420; mobile "Home Mobile v2" 1076:142, a 228px panel). The panel photo is rendered by HomeHeroBackdrop.
export function HomeHero() {
  return (
    <div className="flex min-h-57 flex-col items-start justify-end gap-3 px-5 pt-10 pb-7.5 text-white lg:min-h-150 lg:justify-start lg:gap-6 lg:px-0 lg:pt-31.5 lg:pb-0">
      <Pill tone="light">
        Seguros \ SOAT
        {/* Figma "Home Mobile v2" drops the chevron. */}
        <Image src="/icons/chevron-right.svg" alt="" width={7.5} height={13.5} className="hidden lg:block" />
      </Pill>
      <h1 className="max-w-md text-headline font-medium lg:text-display">
        SOAT al Instante: Cómpralo <strong className="font-bold">100% online</strong>
      </h1>
      {/* Mobile v2 shortens the copy so the hero fits in 228px. */}
      <p className="-mt-1 max-w-lg text-body font-medium lg:hidden">Desde S/ 33 al año · Disponible 24/7</p>
      <p className="hidden max-w-lg text-body lg:block">
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

// The photo is 1420×600 (exported at 2x). On the short mobile panel it is cropped
// to its right side, where Figma mobile v2 frames the driver (and on tablets, which
// crop it vertically, kept near the top so his face stays in view).
const PHOTO_POSITION = { objectPosition: "100% 30%" };

/** Rounded wide panel with the hero photo and the navy veil behind the copy. */
export function HomeHeroBackdrop() {
  return (
    <div aria-hidden className="absolute inset-x-5 top-0 h-57 overflow-hidden rounded-panel bg-brand-900 lg:h-150">
      <Image
        src="/images/hero-banner.jpg"
        alt=""
        fill
        preload
        sizes="(min-width: 1460px) 1420px, 100vw"
        className="object-cover"
        style={PHOTO_POSITION}
      />
      {/* The blue redesign drops the violet veil; a navy one keeps the white copy readable (AA) over the photo. */}
      <div className="absolute inset-0 bg-linear-to-tr from-brand-900/80 via-brand-900/40 via-45% to-transparent lg:bg-linear-to-r lg:from-brand-900/70 lg:via-brand-900/30 lg:via-35% lg:to-transparent lg:to-60%" />
    </div>
  );
}
