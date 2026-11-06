import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";
import { footerNav, site } from "@/lib/site";
import { Container } from "./container";

type FooterLink = { label: string; href: string };

function FooterColumn({ title, links }: { title: string; links: readonly FooterLink[] }) {
  return (
    <div className="hidden flex-col gap-2 lg:flex">
      <h2 className="text-body font-bold text-brand-200 uppercase">{title}</h2>
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

type ContactItemProps = {
  icon: string;
  href: string;
  /** Opens in a new tab (WhatsApp, maps). */
  external?: boolean;
  className?: string;
  children: ReactNode;
};

function ContactItem({ icon, href, external = false, className, children }: ContactItemProps) {
  return (
    <li>
      <a
        href={href}
        {...(external && { target: "_blank", rel: "noreferrer" })}
        className={cn("flex items-start gap-2.5 font-medium hover:underline", className)}
      >
        <Image src={icon} alt="" width={24} height={24} className="shrink-0" />
        <span>{children}</span>
      </a>
    </li>
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
        <div className="mx-auto max-w-content px-5 pt-12.5 pb-7.5 md:px-10 lg:pt-15 xl:px-0">
          {/* Mobile (Figma "Group 86"): centered logo, company data, contact, complaints book and copyright. */}
          <div className="flex justify-center lg:justify-start">
            <Logo tone="light" className="w-46 lg:w-40" />
          </div>

          <div className="mt-20 grid gap-8 lg:mt-10 lg:grid-cols-4">
            <div className="flex flex-col gap-4">
              <p>
                <span className="font-bold">{site.legalName}</span>
                <br />
                RUC: {site.ruc}
              </p>
              <ul className="flex flex-col gap-3">
                <ContactItem icon="/icons/whatsapp.svg" href={site.whatsapp.href} external>
                  <span className="sr-only">WhatsApp </span>
                  {site.whatsapp.label}
                </ContactItem>
                <ContactItem icon="/icons/mail.svg" href={`mailto:${site.email}`}>
                  {site.email}
                </ContactItem>
                <ContactItem icon="/icons/map-pin.svg" href={site.address.href} external className="underline">
                  {site.address.lines[0]}
                  <br />
                  {site.address.lines[1]}
                </ContactItem>
              </ul>
            </div>
            <FooterColumn title="Mapa de sitio" links={footerNav.sitemap} />
            <FooterColumn title="Seguros" links={footerNav.insurance} />
            <div className="flex flex-col gap-8">
              <FooterColumn title="Atención al cliente" links={footerNav.support} />
              <Link
                href={site.complaintsBook}
                className={cn(buttonVariants({ variant: "secondary", size: "md" }), "text-body font-bold normal-case")}
              >
                <Image src="/icons/book.svg" alt="" width={24} height={24} />
                Libro de reclamaciones
              </Link>
            </div>
          </div>

          <p className="mt-7.5 border-t border-on-brand/30 pt-6 text-center lg:mt-12">
            Copyright © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </Container>
  );
}
