import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { QuoteForm } from "@/features/quote/components/quote-form";
import { StepHeader } from "@/features/quote/components/step-header";
import { VehicleSummary } from "@/features/quote/components/vehicle-summary";
import { todayInLima } from "@/features/quote/lib/dates";
import { greetingName } from "@/features/quote/lib/greeting";
import { VEHICLE_USES } from "@/features/quote/lib/vehicle-rules";
import { readQuoteSession } from "@/features/quote/session";
import { getVehicleTypes } from "@/services/catalog";
import { isVehicleComplete } from "@/services/quotes";

export const metadata: Metadata = { title: "Tu cotización" };

const EDIT_VEHICLE_HREF = "/cotizar/vehiculo";

// Figma "Cotización" (240:117, mobile 565:921).
export default async function QuotePage() {
  const session = await readQuoteSession();
  if (!session) redirect("/");
  const { request, result, selection } = session;
  const vehicle = result.vehicle;
  if (!vehicle || !isVehicleComplete(vehicle)) redirect("/cotizar/datos-incompletos");

  // The catalog only names the type and use: without it the summary shows the rest.
  const types = await getVehicleTypes().catch(() => []);
  const type = types.find((option) => option.id === vehicle.typeId);
  const useName =
    type?.uses.find((use) => use.id === vehicle.useId)?.name ??
    Object.values(VEHICLE_USES).find((use) => use.apiId === vehicle.useId)?.label;

  const name = greetingName(result.holder);
  const today = todayInLima();
  const plans = result.plans.map(({ id, product, insurer, priceCents, features }) => ({
    id,
    product,
    insurer,
    priceCents,
    features,
  }));
  const featured = plans.findIndex((plan) => plan.id === result.featuredPlanId);
  if (featured > 0) plans.unshift(...plans.splice(featured, 1));

  return (
    <Container className="grid gap-5 pt-7.5 pb-20 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0 lg:pt-20 lg:pb-30">
      <div className="lg:col-span-5">
        <StepHeader
          step={3}
          total={3}
          backHref={EDIT_VEHICLE_HREF}
          title={`Hola${name ? ` ${name}` : ""}, activa tu SOAT en pocos minutos...`}
          description="Contrátalo hoy y mantén protegido tu vehículo."
        />
      </div>

      <VehicleSummary
        className="mt-5 lg:col-span-7 lg:col-start-6 lg:mt-0 lg:min-w-136 lg:self-end lg:justify-self-end"
        title={[vehicle.brand?.name, vehicle.model?.name, vehicle.year].filter(Boolean).join(" ")}
        details={[
          { label: "Placa", value: vehicle.plate },
          ...(type ? [{ label: "Tipo de Vehículo", value: type.name }] : []),
          ...(useName ? [{ label: "Uso", value: useName }] : []),
        ]}
        editHref={EDIT_VEHICLE_HREF}
      />

      {plans.length > 0 ? (
        <div className="flex flex-col items-center gap-20 lg:col-span-12 lg:mt-39 lg:items-start lg:gap-32">
          <QuoteForm
            plans={plans}
            today={today}
            initial={{
              planId: plans.some((plan) => plan.id === selection?.planId) ? (selection?.planId ?? null) : null,
              startDate: request.startDate < today ? today : request.startDate,
              phone: selection?.phone ?? "",
            }}
          />
        </div>
      ) : (
        // No La Positiva quote (no stock or the quote failed) and AFOCAT is not sold here.
        <section className="flex flex-col items-center gap-6 py-16 text-center lg:col-span-12 lg:py-24">
          <h2 className="max-w-lg text-subtitle font-medium text-ink-strong">
            Por ahora no tenemos un SOAT disponible para tu vehículo
          </h2>
          <p className="max-w-md text-ink-muted">
            Revisa que los datos de tu vehículo sean correctos o vuelve a intentarlo en unos minutos.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href={EDIT_VEHICLE_HREF} className={buttonVariants({ size: "lg" })}>
              Revisar mis datos
            </Link>
            <Link href="/" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Volver al inicio
            </Link>
          </div>
        </section>
      )}
    </Container>
  );
}
