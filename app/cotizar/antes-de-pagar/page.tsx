import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { ContinueToPayment } from "@/features/checkout/components/continue-to-payment";
import { StepBackLink } from "@/features/quote/components/step-header";
import { readQuoteSession } from "@/features/quote/session";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Antes de pagar" };

const NOTES = [
  "Tu póliza se emite apenas se confirme el pago.",
  "Te la enviamos en PDF al correo que registraste. Si no la ves, revisa tu bandeja de spam o promociones.",
];

// Spec section 8 "Antes de pagar", as in Figma "SOAT al instante 5": informative, no fields.
export default async function BeforePaymentPage() {
  const session = await readQuoteSession();
  if (!session) redirect("/");
  // Only after "Ir a pagar" saved a plan of the current quote and the holder data was completed.
  const { selection, result, holderDetails, order } = session;
  if (order?.status === "paid") redirect("/cotizar/confirmacion");
  if (!selection || !result.plans.some((plan) => plan.id === selection.planId)) redirect("/cotizar/cotizacion");
  if (!holderDetails) redirect("/cotizar/titular");

  return (
    <Container className="flex flex-col gap-12 pt-7.5 pb-24 lg:gap-10 lg:pt-20 lg:pb-60">
      {/* Same step as the holder data (vehicle 1/3 → quote 2/3 → holder 3/3); the spec shows "PASO 2/2". */}
      <div>
        <StepBackLink step={3} total={3} href="/cotizar/titular" />
      </div>

      <ContinueToPayment
        publicKey={env.NEXT_PUBLIC_CULQI_PUBLIC_KEY}
        intro={
          <>
            <Image src="/illustrations/hand-shield.svg" alt="" width={102} height={101} />
            <div className="flex max-w-112 flex-col gap-4">
              <h1 className="text-subtitle font-semibold text-ink-strong lg:text-title">¡Tu SOAT está casi listo!</h1>
              <p className="text-body text-ink-strong lg:text-subtitle">
                Completa el pago de forma segura y recibe tu póliza en tu correo en pocos minutos.
              </p>
            </div>
            <ul className="flex max-w-80 flex-col gap-4 text-left">
              {NOTES.map((note) => (
                <li key={note} className="flex gap-2">
                  <Image src="/icons/check-circle.svg" alt="" width={19} height={20} className="mt-0.5 shrink-0 self-start" />
                  {note}
                </li>
              ))}
            </ul>
          </>
        }
      />
    </Container>
  );
}
