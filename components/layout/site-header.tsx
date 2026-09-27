import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";
import { contactHref, mainNav } from "@/lib/site";
import { Container } from "./container";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md">
      <Container className="flex h-18 items-center justify-between gap-6 lg:h-27.5">
        <Link href="/" className="shrink-0">
          <Logo className="w-30 lg:w-40" />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-8 lg:flex">
          <ul className="flex items-center gap-8">
            {mainNav.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 text-nav font-bold text-ink-soft uppercase transition-colors hover:text-brand-500"
                >
                  {item.label}
                  {item.label === "Seguros" && (
                    <Image src="/icons/chevron-down.svg" alt="" width={9} height={5} />
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <Link href={contactHref} className={buttonVariants({ size: "lg" })}>
            Contáctanos
          </Link>
        </nav>

        {/* Mobile menu: native <details>, no client JS. */}
        <details className="group relative lg:hidden">
          <summary
            aria-label="Abrir menú"
            className="grid size-11 cursor-pointer list-none place-items-center [&::-webkit-details-marker]:hidden"
          >
            <span aria-hidden className="flex w-5.5 flex-col gap-1">
              <span className="h-0.5 rounded-full bg-ink transition group-open:translate-y-1.5 group-open:rotate-45" />
              <span className="h-0.5 rounded-full bg-ink transition group-open:opacity-0" />
              <span className="h-0.5 rounded-full bg-ink transition group-open:-translate-y-1.5 group-open:-rotate-45" />
            </span>
          </summary>
          <nav
            aria-label="Principal"
            className="absolute top-full right-0 mt-2 w-64 rounded-card bg-white p-5 shadow-cta"
          >
            <ul className="flex flex-col gap-1">
              {mainNav.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="block rounded-control px-3 py-3 text-nav font-bold text-ink-soft uppercase hover:bg-brand-50"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={contactHref} className={cn(buttonVariants({ size: "md" }), "mt-4 w-full")}>
              Contáctanos
            </Link>
          </nav>
        </details>
      </Container>
    </header>
  );
}
