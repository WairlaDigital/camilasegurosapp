"use server";

import { getVehicleTypes } from "@/services/catalog";
import { ApiError } from "@/services/errors";
import { queryInfo } from "@/services/quotes";
import { DOCUMENT_TYPES } from "./lib/vehicle-rules";
import { readQuoteSession, writeQuoteSession } from "./session";
import { parseVehicleForm, type VehicleFieldErrors } from "./vehicle-schema";

export type SaveVehicleState =
  | { status: "idle" }
  | { status: "invalid"; errors: VehicleFieldErrors }
  | { status: "failed"; message: string }
  | { status: "ready" };

/**
 * Vehicle data form submit: re-quotes with the manual data (POST /query-info)
 * and updates the quote session.
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

  const parsed = parseVehicleForm(Object.fromEntries(formData), types);
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors };
  const vehicle = parsed.data;

  let result;
  try {
    result = await queryInfo({
      documentType: DOCUMENT_TYPES[session.input.documentType].apiId,
      documentNumber: session.input.documentNumber,
      plate: session.input.plate,
      typeId: vehicle.typeId,
      useId: vehicle.useId,
      ubigeoId: session.request.ubigeoId,
      manual: {
        brandId: vehicle.brandId,
        modelId: vehicle.modelId,
        versionId: vehicle.versionId,
        seats: vehicle.seats,
        year: vehicle.year,
        serial: vehicle.serial,
        vin: vehicle.vin,
      },
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
  // tables, so the session keeps what the user entered.
  await writeQuoteSession({
    ...session,
    request: { ...session.request, typeId: vehicle.typeId, useId: vehicle.useId },
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

  // TODO(quote screen): redirect to the quote step once it exists.
  return { status: "ready" };
}
