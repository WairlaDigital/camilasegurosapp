// Site-wide content from the Figma header and footer.
// Links marked TODO are pending real URLs (see PENDIENTES.md).

const address = ["Ca. Francisco La Rosa 138", "Stgo. de Surco, Lima - Perú"] as const;

export const site = {
  name: "Camila Seguros",
  legalName: "Corporación Camilla S.A.C.",
  ruc: "20601241341",
  whatsapp: { label: "908 855 202", href: "https://wa.me/51908855202" },
  email: "soporte@seguroscamila.pe",
  address: {
    lines: address,
    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.join(", "))}`,
  },
  complaintsBook: "#", // TODO: Libro de reclamaciones
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
    { label: "Contáctenos", href: "#" }, // TODO
  ],
  insurance: [
    { label: "SOAT", href: "/" },
    { label: "Seguro Vehicular", href: "#" }, // TODO
    { label: "Seguro Vida Ley", href: "#" }, // TODO
    { label: "Seguro SCTR", href: "#" }, // TODO
  ],
  support: [
    { label: "Términos y Condiciones", href: "#" }, // TODO
    { label: "Política de Privacidad", href: "#" }, // TODO
    { label: "Anulaciones y Devoluciones", href: "#" }, // TODO
  ],
} as const;
