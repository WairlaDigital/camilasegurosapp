import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { ContinueToPayment } from "@/features/checkout/components/continue-to-payment";
import { StepBackLink } from "@/features/quote/components/step-header";
import { readQuoteSession } from "@/features/quote/session";

export const metadata: Metadata = { title: "Antes de pagar" };

const NOTES = [
  "Recibirás en tu correo el código y las indicaciones para efectuar el pago.",
  "Si pagas en un agente, consulta sus horarios de atención antes de acercarte.",
];

// Spec section 8 "Antes de pagar": informative, no fields. Not in Figma.
export default async function BeforePaymentPage() {
  const session = await readQuoteSession();
  if (!session) redirect("/");
  // Only after "Ir a pagar" saved a plan of the current quote and the holder data was completed.
  const { selection, result, holderDetails } = session;
  if (!selection || !result.plans.some((plan) => plan.id === selection.planId)) redirect("/cotizar/cotizacion");
  if (!holderDetails) redirect("/cotizar/titular");

  return (
    <Container className="grid gap-12 pt-7.5 pb-24 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-29 lg:pt-20 lg:pb-60">
      {/* Same step as the holder data (vehicle 1/3 → quote 2/3 → holder 3/3); the spec shows "PASO 2/2". */}
      <div className="lg:col-span-12">
        <StepBackLink step={3} total={3} href="/cotizar/titular" />
      </div>

      <section className="flex flex-col gap-9 md:max-w-112 lg:col-span-5 lg:col-start-5 lg:max-w-none">
        <div className="flex flex-col gap-4">
          <h1 className="max-w-100 text-subtitle font-medium text-ink-strong lg:text-title">
            ¡Estás a un paso de obtener tu SOAT!
          </h1>
          <p className="text-body text-ink-strong lg:text-subtitle">Completa el pago y recibe tu SOAT en pocos minutos.</p>
        </div>

        <ul className="flex flex-col gap-3">
          {NOTES.map((note) => (
            <li key={note} className="flex gap-2">
              <Image src="/icons/check-circle.svg" alt="" width={19} height={20} className="mt-0.5 shrink-0 self-start" />
              {note}
            </li>
          ))}
        </ul>

        <ContinueToPayment />
      </section>
    </Container>
  );
}
