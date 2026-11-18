import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { expiryFromQuery } from "@/features/quote/lib/active-policy";
import { formatDate } from "@/features/quote/lib/dates";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Ya tienes un SOAT vigente" };

// La Positiva did not quote: the plate already has a SOAT in force (code 20003).
// The expiry date comes in `?vence=` (startQuote / saveVehicle); without it the
// screen still says the SOAT is active.
export default async function ActivePolicyPage({ searchParams }: PageProps<"/cotizar/soat-vigente">) {
  const expiresAt = expiryFromQuery((await searchParams).vence);

  return (
    <Container className="flex flex-col items-center gap-6 pt-12 pb-24 text-center lg:pt-24 lg:pb-40">
      <span className="flex size-16 items-center justify-center rounded-tile bg-brand-500">
        <Image src="/icons/shield-check.svg" alt="" width={28} height={28} />
      </span>

      <div className="flex max-w-130 flex-col gap-3">
        <h1 className="text-subtitle font-medium text-ink-strong">
          ¡Buenas noticias, ya estás protegido!
        </h1>
        <p className="text-body text-ink">
          Tu vehículo ya cuenta con un SOAT vigente. Cuando se acerque la fecha, te ayudamos a renovarlo en minutos.
        </p>
      </div>

      {expiresAt && (
        <p className="w-full max-w-130 rounded-control bg-brand-50 px-4 py-4 text-body">
          <span className="text-brand-500">Vence el:</span>{" "}
          <time dateTime={expiresAt} className="font-semibold text-ink-strong">
            {formatDate(expiresAt)}
          </time>
        </p>
      )}

      <div className="mt-2 flex w-full max-w-130 flex-col gap-4 sm:flex-row">
        <Link href="/#plate" className={cn(buttonVariants({ fullWidth: true }), "sm:flex-1")}>
          Cotizar otra placa
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "secondary", fullWidth: true }), "sm:flex-1")}>
          Volver al inicio
        </Link>
      </div>
    </Container>
  );
}
