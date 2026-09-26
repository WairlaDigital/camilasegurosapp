import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { footerNav, site } from "@/lib/site";
import { Container } from "./container";

type FooterLink = { label: string; href: string };

function FooterColumn({ title, links }: { title: string; links: readonly FooterLink[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-body font-bold uppercase">{title}</h2>
      <ul className="list-disc ps-6 font-medium leading-relaxed">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <Container width="wide" className="pb-5 md:pb-8">
      <footer className="relative isolate overflow-hidden rounded-panel bg-brand-900 text-body text-on-brand">
        <Image
          src="/brand/footer-pattern.svg"
          alt=""
          fill
          className="-z-10 object-cover object-right"
        />
        <div className="mx-auto max-w-content px-5 pt-15 pb-8 md:px-10 xl:px-0">
          <Logo tone="light" />

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-4">
              <p className="font-bold">
                {site.legalName}
                <br />
                RUC: {site.ruc}
              </p>
              <a href={site.phone.href} className="flex items-center gap-2.5 font-medium hover:underline">
                <Image src="/icons/phone.svg" alt="" width={26.7678} height={26.762} />
                <span>
                  Llámanos
                  <br />
                  al {site.phone.label}
                </span>
              </a>
            </div>
            <FooterColumn title="Mapa de sitio" links={footerNav.sitemap} />
            <FooterColumn title="Seguros" links={footerNav.insurance} />
            <div className="flex flex-col gap-2">
              <h2 className="text-body font-bold uppercase">Redes sociales</h2>
              <a href={site.facebook} aria-label="Facebook de Camila Seguros" className="w-fit">
                <Image src="/icons/facebook.svg" alt="" width={42} height={44} />
              </a>
            </div>
          </div>

          <p className="mt-12 border-t border-on-brand/30 pt-6 text-center">
            Copyright © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </Container>
  );
}
