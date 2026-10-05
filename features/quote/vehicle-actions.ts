"use server";

import { redirect } from "next/navigation";
import { getVehicleTypes } from "@/services/catalog";
import { ApiError } from "@/services/errors";
import { queryInfo } from "@/services/quotes";
import { todayInLima } from "./lib/dates";
import { limitRequote, sessionKey, TOO_MANY_REQUESTS } from "./lib/limits";
import { detectCategory } from "./lib/plate";
import { typesForCategory } from "./lib/use-matrix";
import { DOCUMENT_TYPES } from "./lib/vehicle-rules";
import { readQuoteSession, writeQuoteSession, type QuoteSession } from "./session";
import { lockedVehicleFields, parseVehicleForm, type VehicleFieldErrors, type VehicleFormValues } from "./vehicle-schema";

export type SaveVehicleState =
  | { status: "idle" }
  | { status: "invalid"; errors: VehicleFieldErrors }
  | { status: "failed"; message: string };

/** Same vehicle, type and use as the current quote: nothing to quote again. */
function sameAsQuoted(vehicle: VehicleFormValues, session: QuoteSession): boolean {
  const quoted = session.result.vehicle;
  return Boolean(
    quoted &&
      vehicle.typeId === session.request.typeId &&
      vehicle.useId === session.request.useId &&
      vehicle.brandId === quoted.brand?.id &&
      vehicle.modelId === quoted.model?.id &&
      vehicle.versionId === quoted.version?.id &&
      vehicle.seats === quoted.seats &&
      vehicle.year === quoted.year &&
      vehicle.serial === quoted.serial &&
      vehicle.vin === quoted.vin,
  );
}

/**
 * Vehicle data form submit (step 2/3). When the person completed data or changed
 * the type or use, it quotes again with the manual data (POST /query-info);
 * otherwise the current quote stays. Then it moves to the quote screen.
 */
export async function saveVehicle(_prev: SaveVehicleState, formData: FormData): Promise<SaveVehicleState> {
  const session = await readQuoteSession();
  if (!session) {
    return { status: "failed", message: "Tu sesión expiró. Vuelve a ingresar tu placa para cotizar." };
  }

  let types;
  try {
    types = await getVehicleTypes();
  } catch (error) {
    console.error("saveVehicle: /data failed", error);
    return { status: "failed", message: "No pudimos validar tus datos. Inténtalo de nuevo en unos minutos." };
  }

  // Only types of the category fixed by the plate (spec 4.1). The plate was validated on the home form.
  const category = detectCategory(session.input.plate) ?? "auto";
  const parsed = parseVehicleForm(Object.fromEntries(formData), {
    types: typesForCategory(types, category),
    documentType: session.input.documentType,
    locked: lockedVehicleFields(session.vehicleLookup),
  });
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors };
  const vehicle = parsed.data;

  // Every field came from the plate lookup (or was already quoted): no new quote.
  if (sameAsQuoted(vehicle, session)) {
    await writeQuoteSession({ ...session, vehicleConfirmed: true });
    redirect("/cotizar/cotizacion");
  }

  if (!limitRequote(sessionKey(session)).ok) return { status: "failed", message: TOO_MANY_REQUESTS };

  const manual = {
    brandId: vehicle.brandId,
    modelId: vehicle.modelId,
    versionId: vehicle.versionId,
    seats: vehicle.seats,
    year: vehicle.year,
    serial: vehicle.serial,
    vin: vehicle.vin,
  };
  // Keep the start date chosen on the quote screen ("Editar") unless it is already past.
  const today = todayInLima();
  const startDate = session.request.startDate < today ? today : session.request.startDate;

  let result;
  try {
    result = await queryInfo({
      documentType: DOCUMENT_TYPES[session.input.documentType].apiId,
      documentNumber: session.input.documentNumber,
      plate: session.input.plate,
      typeId: vehicle.typeId,
      useId: vehicle.useId,
      ubigeoId: session.request.ubigeoId,
      startDate,
      manual,
    });
  } catch (error) {
    if (error instanceof ApiError && error.code === "VALIDATION" && error.fieldErrors) {
      console.error("saveVehicle: /query-info rejected the data", error.fieldErrors);
    } else {
      console.error("saveVehicle: /query-info failed", error);
    }
    return { status: "failed", message: "No pudimos cotizar con estos datos. Revísalos e inténtalo de nuevo." };
  }

  if (!result.vehicle) {
    // The backend drops manual data when the plate lookup fails (PENDIENTES.md, backend 🔴).
    return {
      status: "failed",
      message: "No pudimos completar la consulta de tu vehículo. Escríbenos y te ayudamos a cotizar.",
    };
  }

  // The response only echoes models/versions that exist in the backend's local
  // tables, so the session keeps what the user entered. The new quote replaces
  // the previous one and its plan choice (there is no endpoint to invalidate it).
  await writeQuoteSession({
    ...session,
    vehicleConfirmed: true,
    selection: undefined,
    request: { ...session.request, typeId: vehicle.typeId, useId: vehicle.useId, startDate, manual },
    result: {
      ...result,
      vehicle: {
        plate: result.vehicle.plate,
        typeId: vehicle.typeId,
        useId: vehicle.useId,
        brand: { id: vehicle.brandId, name: vehicle.brandName },
        model: { id: vehicle.modelId, name: vehicle.modelName },
        version: { id: vehicle.versionId, name: vehicle.versionName },
        year: vehicle.year,
        seats: vehicle.seats,
        serial: vehicle.serial,
        vin: vehicle.vin,
      },
    },
  });

  redirect("/cotizar/cotizacion");
}
