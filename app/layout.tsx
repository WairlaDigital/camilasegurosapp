import type { Metadata } from "next";
import { Red_Hat_Display } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const redHatDisplay = Red_Hat_Display({
  variable: "--font-red-hat-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SOAT al instante: cómpralo 100% online | Camila Seguros",
    template: "%s | Camila Seguros",
  },
  description:
    "Compra tu SOAT en minutos y recíbelo al instante en tu correo. Sin colas ni papeleos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${redHatDisplay.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-gradient-page">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
