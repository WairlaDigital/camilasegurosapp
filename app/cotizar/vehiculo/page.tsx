import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { StepHeader } from "@/features/quote/components/step-header";
import { VehicleForm } from "@/features/quote/components/vehicle-form";
import { readQuoteSession } from "@/features/quote/session";
import { getModels, getVehicleTypes, getVersions } from "@/services/catalog";

export const metadata: Metadata = { title: "Datos de tu vehículo" };

// Figma "Ingresa los datos de su vehículo" (267:24, mobile 564:818).
export default async function VehiclePage() {
  const session = await readQuoteSession();
  if (!session) redirect("/");

  const vehicle = session.result.vehicle ?? {
    plate: session.input.plate,
    typeId: session.request.typeId,
    useId: session.request.useId,
  };

  // Lists for the prefilled brand/model, fetched in parallel with the types.
  const [types, models, versions] = await Promise.all([
    getVehicleTypes(),
    vehicle.brand ? getModels(vehicle.brand.id, vehicle.typeId) : [],
    vehicle.model ? getVersions(vehicle.model.id) : [],
  ]);

  return (
    <Container className="grid gap-10 pt-7.5 pb-20 lg:grid-cols-12 lg:gap-x-8 lg:pt-20">
      <div className="flex flex-col gap-6 lg:col-span-8 lg:gap-12.5">
        <StepHeader step={2} total={3} backHref="/" title="Ingresa los datos de tu vehículo." plate={vehicle.plate} />
        <VehicleForm types={types} initial={vehicle} initialModels={models} initialVersions={versions} />
      </div>
      {/* Figma: help text beside the form on desktop only. */}
      <aside className="hidden flex-col gap-1 lg:col-span-4 lg:col-start-9 lg:flex lg:pt-43">
        <h2 className="text-subtitle font-medium text-ink-strong">Información adicional de tu vehículo</h2>
        <p className="text-small text-ink-strong">
          Puedes encontrar estos datos en la tarjeta de propiedad de tu vehículo.
        </p>
      </aside>
    </Container>
  );
}
