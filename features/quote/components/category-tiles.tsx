import Image from "next/image";
import { cn } from "@/lib/cn";
import type { VehicleCategory } from "../lib/plate";
import { CATEGORIES } from "../lib/vehicle-rules";

// Moto icon from Figma: two SVG groups placed inside a 67.39×49.09 box.
function MotoIcon() {
  return (
    <span aria-hidden className="relative block aspect-67/49 w-17">
      <span className="absolute" style={{ top: "1.53%", right: "1.12%", bottom: "19.11%", left: "17.81%" }}>
        <Image src="/icons/moto-part-a.svg" alt="" fill />
      </span>
      <span className="absolute" style={{ top: "40.99%", right: "32.41%", bottom: "1.51%", left: "1.11%" }}>
        <Image src="/icons/moto-part-b.svg" alt="" fill />
      </span>
    </span>
  );
}

type CategoryTilesProps = { detected: VehicleCategory | null };

/**
 * Figma "Component 7". The category is detected from the plate and cannot be
 * changed by hand (spec 4.1), so the tiles are read-only indicators.
 */
export function CategoryTiles({ detected }: CategoryTilesProps) {
  return (
    <fieldset>
      <legend className="sr-only">Tipo de vehículo (se detecta con tu placa)</legend>
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(CATEGORIES) as VehicleCategory[]).map((category) => {
          const selected = detected === category;
          return (
            <label
              key={category}
              className={cn(
                "flex h-35.5 flex-col items-center justify-end gap-3 rounded-control border px-3 pb-3.5 text-center transition-colors",
                selected ? "border-brand-500 bg-brand-50" : "border-line bg-white",
              )}
            >
              <span className="grid h-12.5 place-items-center">
                {/* TODO: auto icon pending export from Figma (see PENDIENTES.md). */}
                {category === "moto" && <MotoIcon />}
              </span>
              <span className="text-small leading-none font-bold text-ink">{CATEGORIES[category].label}</span>
              <input type="radio" name="category" value={category} checked={selected} readOnly disabled className="peer sr-only" />
              <span
                aria-hidden
                className="grid size-4.5 place-items-center rounded-full border-2 border-brand-500 after:size-2 after:scale-0 after:rounded-full after:bg-brand-500 after:transition-transform peer-checked:after:scale-100"
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
