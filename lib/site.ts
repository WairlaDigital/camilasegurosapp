// Site-wide content from the Figma header and footer.
// Links marked TODO are pending real URLs (see PENDIENTES.md).

export const site = {
  name: "Camila Seguros",
  legalName: "Camila Seguros S.A.C.",
  ruc: "10106288831",
  phone: { label: "(01) 584 7454", href: "tel:+5115847454" },
  facebook: "#", // TODO
} as const;

export const mainNav = [
  { label: "Principal", href: "/" },
  { label: "Seguros", href: "#" }, // TODO: dropdown content not defined in Figma
  { label: "Beneficios", href: "#" }, // TODO
  { label: "Testimonios", href: "#" }, // TODO
  { label: "Blog", href: "#" }, // TODO
] as const;

export const contactHref = "#"; // TODO

export const footerNav = {
  sitemap: [
    { label: "Principal", href: "/" },
    { label: "Blog", href: "#" }, // TODO
    { label: "Contáctanos", href: "#" }, // TODO
    { label: "Términos y Condiciones", href: "#" }, // TODO
  ],
  insurance: [
    { label: "SOAT", href: "/" },
    { label: "Seguro Vehicular", href: "#" }, // TODO
    { label: "Seguro Vida Ley", href: "#" }, // TODO
    { label: "Seguro SCTR", href: "#" }, // TODO
  ],
} as const;
