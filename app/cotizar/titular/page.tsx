import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { HolderForm } from "@/features/quote/components/holder-form";
import { StepHeader } from "@/features/quote/components/step-header";
import { lockedHolderFields } from "@/features/quote/holder-schema";
import { DOCUMENT_TYPES } from "@/features/quote/lib/vehicle-rules";
import { readQuoteSession } from "@/features/quote/session";

export const metadata: Metadata = { title: "Datos del titular" };

// Figma "Completa los datos del titular" (433:174, mobile 563:546): step 1/3, before
// the vehicle and the plans. Names come from /query-info; the address goes to POST /data.
export default async function HolderPage() {
  const session = await readQuoteSession();
  if (!session) redirect("/");
  const { result, input, holderDetails } = session;

  return (
    <Container className="flex flex-col gap-6 pt-7.5 pb-20 lg:gap-12.5 lg:pt-20 lg:pb-50">
      <StepHeader step={1} total={3} backHref="/" title="Completa los datos del titular" plate={input.plate} />
      <div className="lg:max-w-208">
        <HolderForm
          document={{ type: DOCUMENT_TYPES[input.documentType].label, number: input.documentNumber }}
          personType={input.documentType === "RUC" ? "Jurídica" : "Natural"}
          companyName={input.documentType === "RUC" ? result.holder?.companyName : undefined}
          locked={lockedHolderFields(result.holder)}
          initial={holderDetails ?? { email: input.email }}
        />
      </div>
    </Container>
  );
}
