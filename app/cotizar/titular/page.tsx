import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { HolderForm } from "@/features/quote/components/holder-form";
import { StepHeader } from "@/features/quote/components/step-header";
import { lockedHolderFields } from "@/features/quote/holder-schema";
import { DOCUMENT_TYPES } from "@/features/quote/lib/vehicle-rules";
import { readQuoteSession } from "@/features/quote/session";

export const metadata: Metadata = { title: "Datos del titular" };

// Figma "Completa los datos del titular" (433:174, mobile 563:546). In this flow it
// comes after the quote (decision 2026-09-29) and asks only what POST /data accepts.
export default async function HolderPage() {
  const session = await readQuoteSession();
  if (!session) redirect("/");
  // Only after "Ir a pagar" saved a plan of the current quote.
  const { selection, result, input, holderDetails } = session;
  if (!selection || !result.plans.some((plan) => plan.id === selection.planId)) redirect("/cotizar/cotizacion");

  return (
    <Container className="flex flex-col gap-6 pt-7.5 pb-20 lg:gap-12.5 lg:pt-20 lg:pb-50">
      <StepHeader
        step={3}
        total={3}
        backHref="/cotizar/cotizacion"
        title="Completa los datos del titular"
        plate={input.plate}
      />
      <div className="lg:max-w-208">
        <HolderForm
          document={{ type: DOCUMENT_TYPES[input.documentType].label, number: input.documentNumber }}
          companyName={input.documentType === "RUC" ? result.holder?.companyName : undefined}
          locked={lockedHolderFields(result.holder)}
          initial={holderDetails ?? {}}
        />
      </div>
    </Container>
  );
}
