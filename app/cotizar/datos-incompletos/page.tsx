import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { readQuoteSession } from "@/features/quote/session";

export const metadata: Metadata = { title: "Datos incompletos" };

// Spec 5.2: short transition screen, no technical detail of what is missing.
// TODO: illustration (car with warning) pending export from Figma/spec.
export default async function IncompleteDataPage() {
  if (!(await readQuoteSession())) redirect("/");

  return (
    <Container className="flex flex-col items-center gap-8 py-24 text-center lg:py-40">
      <h1 className="max-w-sm text-subtitle font-medium text-ink-strong lg:text-title">
        ¡Los datos de tu vehículo están incompletos!
      </h1>
      <Link href="/cotizar/vehiculo" className={buttonVariants({ size: "lg" })}>
        Completa y cotiza
      </Link>
    </Container>
  );
}
