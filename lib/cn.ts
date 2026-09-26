import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge the custom tokens from app/globals.css, otherwise it
// treats `text-display` as a color and drops it next to `text-white`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display", "title", "subtitle", "body", "label", "small", "caption", "nav"],
      radius: ["check", "control", "tile", "card", "panel"],
      shadow: ["cta"],
      container: ["content", "wide"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
