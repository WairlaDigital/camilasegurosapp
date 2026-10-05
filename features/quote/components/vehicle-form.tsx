"use client";

import { startTransition, useActionState, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Option, VehicleData, VehicleTypeOption } from "@/types/quote";
import { allowedUses } from "../lib/use-matrix";
import type { DocumentType } from "../lib/vehicle-rules";
import { saveVehicle, type SaveVehicleState } from "../vehicle-actions";
import {
  noUseMessage,
  parseVehicleForm,
  type LockedVehicleFields,
  type VehicleField,
  type VehicleFieldErrors,
} from "../vehicle-schema";

type VehicleFormProps = {
  /** Only the types of the category fixed by the plate (spec 4.1). */
  types: VehicleTypeOption[];
  documentType: DocumentType;
  initial: VehicleData;
  /** What the plate lookup gave: shown locked; the person completes the rest. */
  locked: LockedVehicleFields;
  /** Null when the list could not be loaded (La Positiva did not answer). */
  initialModels: Option<string>[] | null;
  initialVersions: Option<string>[] | null;
};

type ListStatus = "idle" | "loading" | "error";

async function fetchOptions(url: string): Promise<Option<string>[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} → ${response.status}`);
  const body: { data: { id: string | number; name: string }[] } = await response.json();
  return body.data.map(({ id, name }) => ({ id: String(id), name }));
}

const searchBrands = async (query: string): Promise<ComboboxOption[]> =>
  fetchOptions(`/api/vehicles/brands?search=${encodeURIComponent(query)}`);

const FIELDS: VehicleField[] = ["useId", "typeId", "brandId", "modelId", "versionId", "seats", "year", "serial", "vin"];

/**
 * Figma "Ingresa los datos de su vehículo" (267:24), step 2/3, always shown: what
 * the plate lookup gave is locked and the person completes what is missing.
 */
export function VehicleForm({ types, documentType, initial, locked, initialModels, initialVersions }: VehicleFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<SaveVehicleState, FormData>(saveVehicle, { status: "idle" });

  const [brand, setBrand] = useState<ComboboxOption | null>(initial.brand ?? null);
  const [models, setModels] = useState(initialModels ?? []);
  const [modelsStatus, setModelsStatus] = useState<ListStatus>(initialModels ? "idle" : "error");
  const [modelId, setModelId] = useState(initial.model?.id ?? "");
  const [versions, setVersions] = useState(initialVersions ?? []);
  const [versionsStatus, setVersionsStatus] = useState<ListStatus>(initialVersions ? "idle" : "error");
  const [versionId, setVersionId] = useState(initial.version?.id ?? "");
  const [seats, setSeats] = useState(initial.seats ? String(initial.seats) : "");
  const [year, setYear] = useState(initial.year ? String(initial.year) : "");
  const [serial, setSerial] = useState(initial.serial ?? "");
  const [vin, setVin] = useState(initial.vin ?? "");
  const [clientErrors, setClientErrors] = useState<Partial<Record<VehicleField, string | null>>>({});

  // Type and use are those of the quote: changing them would need another quote.
  const typeId = locked.typeId ?? String(initial.typeId);
  const useId = locked.useId ?? String(initial.useId);
  const type = types.find((option) => String(option.id) === typeId);
  const useName = type?.uses.find((use) => String(use.id) === useId)?.name ?? "";
  // Spec section 2 and 4.2: the quoted use may not apply (e.g. RUC + moto lineal without a registration).
  const useAllowed = type ? allowedUses(type, documentType).some((use) => String(use.id) === useId) : false;
  const modelName = models.find((model) => model.id === modelId)?.name ?? "";
  const versionName = versions.find((version) => version.id === versionId)?.name ?? "";
  // Spec: "Continuar" is enabled only when every required field has a value.
  const filled =
    useAllowed &&
    [brand, modelId, versionId, seats, year, serial, vin].every((value) =>
      typeof value === "string" ? value.trim() !== "" : value !== null,
    );

  /** A locked value: read-only, not submitted (the server keeps the lookup's value). */
  const fixedField = (name: string, label: string, value: string, className?: string, hint?: string) => (
    <Input name={name} label={label} variant="inset" disabled value={value} readOnly className={className} hint={hint} />
  );

  const serverErrors: VehicleFieldErrors = state.status === "invalid" ? state.errors : {};
  const errorFor = (field: VehicleField) => {
    const clientError = clientErrors[field];
    return clientError === null ? undefined : (clientError ?? serverErrors[field]);
  };

  // Models depend on brand + type; versions on the model. Loaded from event handlers.
  async function loadModels(nextBrand: ComboboxOption | null, nextTypeId: string) {
    if (locked.modelId) return; // the lookup's model stays
    setModelId("");
    setVersionId("");
    setModels([]);
    setVersions([]);
    if (!nextBrand || !nextTypeId) return;
    setModelsStatus("loading");
    try {
      setModels(await fetchOptions(`/api/vehicles/models?brandId=${nextBrand.id}&typeId=${nextTypeId}`));
      setModelsStatus("idle");
    } catch {
      setModelsStatus("error");
    }
  }

  async function loadVersions(nextModelId: string) {
    if (locked.versionId) return;
    setVersionId("");
    setVersions([]);
    if (!nextModelId) return;
    setVersionsStatus("loading");
    try {
      setVersions(await fetchOptions(`/api/vehicles/versions?modelId=${nextModelId}`));
      setVersionsStatus("idle");
    } catch {
      setVersionsStatus("error");
    }
  }

  function validate(): VehicleFieldErrors {
    if (!formRef.current) return {};
    const result = parseVehicleForm(Object.fromEntries(new FormData(formRef.current)), { types, documentType, locked });
    return result.ok ? {} : result.errors;
  }

  function handleBlur(field: VehicleField) {
    const errors = validate();
    setClientErrors((prev) => ({ ...prev, [field]: errors[field] ?? null }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      // `null` hides a stale server error on a field that is now valid.
      setClientErrors(Object.fromEntries(FIELDS.map((field) => [field, errors[field] ?? null])));
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    // Valid: let the Server Action's field errors (if any) show.
    setClientErrors({});
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  const listPlaceholder = (status: ListStatus, empty: string, ready: string) =>
    status === "loading" ? "Cargando…" : status === "error" ? "No pudimos cargar la lista" : empty || ready;
  // The model and version lists come from La Positiva, which is sometimes down.
  const listHint = (status: ListStatus) =>
    status === "error" ? "El catálogo no respondió. Inténtalo de nuevo en unos minutos." : undefined;

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-10">
      <input type="hidden" name="brandName" value={brand?.name ?? ""} />
      <input type="hidden" name="modelName" value={modelName} />
      <input type="hidden" name="versionName" value={versionName} />

      <div className="grid gap-5 md:grid-cols-2 md:gap-x-8">
        <input type="hidden" name="useId" value={useId} />
        <input type="hidden" name="typeId" value={typeId} />
        {fixedField(
          "useIdFixed",
          "Tipo de uso",
          useName.toUpperCase(),
          undefined,
          type && !useAllowed
            ? noUseMessage(type.id, documentType)
            : "Para cambiar el uso o el tipo de vehículo, vuelve a cotizar desde el inicio.",
        )}
        {fixedField("typeIdFixed", "Tipo de vehículo", type?.name.toUpperCase() ?? "")}

        {locked.brandName ? (
          fixedField("brandIdFixed", "Marca", locked.brandName)
        ) : (
          <Combobox
            name="brandId"
            label="Marca"
            variant="inset"
            placeholder="Escribe la marca"
            value={brand}
            onChange={(option) => {
              setBrand(option);
              void loadModels(option, typeId);
            }}
            loadOptions={searchBrands}
            maxLength={40} // what /api/vehicles/brands accepts
            error={errorFor("brandId")}
          />
        )}

        {locked.modelId ? (
          fixedField("modelIdFixed", "Modelo", locked.modelName ?? "")
        ) : (
          <Select
            name="modelId"
            label="Modelo"
            variant="inset"
            placeholder={listPlaceholder(modelsStatus, brand ? "" : "Primero elige la marca", "Selecciona el modelo")}
            disabled={models.length === 0}
            value={modelId}
            onChange={(event) => {
              setModelId(event.target.value);
              void loadVersions(event.target.value);
            }}
            onBlur={() => handleBlur("modelId")}
            error={errorFor("modelId")}
            hint={listHint(modelsStatus)}
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </Select>
        )}

        {locked.versionId ? (
          fixedField("versionIdFixed", "Versión", locked.versionName ?? "")
        ) : (
          <Select
            name="versionId"
            label="Versión"
            variant="inset"
            placeholder={listPlaceholder(versionsStatus, modelId ? "" : "Primero elige el modelo", "Selecciona la versión")}
            disabled={versions.length === 0}
            value={versionId}
            onChange={(event) => setVersionId(event.target.value)}
            onBlur={() => handleBlur("versionId")}
            error={errorFor("versionId")}
            hint={listHint(versionsStatus)}
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.name}
              </option>
            ))}
          </Select>
        )}

        {locked.seats ? (
          fixedField("seatsFixed", "Nro. de asientos", locked.seats)
        ) : (
          <Input
            name="seats"
            label="Nro. de asientos"
            variant="inset"
            inputMode="numeric"
            maxLength={2}
            value={seats}
            onChange={(event) => setSeats(event.target.value)}
            onBlur={() => handleBlur("seats")}
            error={errorFor("seats")}
          />
        )}

        {locked.year ? (
          fixedField("yearFixed", "Año de fabricación", locked.year)
        ) : (
          <Input
            name="year"
            label="Año de fabricación"
            variant="inset"
            inputMode="numeric"
            maxLength={4}
            value={year}
            onChange={(event) => setYear(event.target.value)}
            onBlur={() => handleBlur("year")}
            error={errorFor("year")}
          />
        )}

        {locked.serial ? (
          fixedField("serialFixed", "Nro. de serie", locked.serial)
        ) : (
          <Input
            name="serial"
            label="Nro. de serie"
            variant="inset"
            autoCapitalize="characters"
            maxLength={20}
            value={serial}
            onChange={(event) => setSerial(event.target.value.toUpperCase())}
            onBlur={() => handleBlur("serial")}
            error={errorFor("serial")}
          />
        )}

        {locked.vin ? (
          fixedField("vinFixed", "VIN", locked.vin, "md:col-span-2")
        ) : (
          <Input
            name="vin"
            label="VIN"
            variant="inset"
            autoCapitalize="characters"
            maxLength={20}
            value={vin}
            onChange={(event) => setVin(event.target.value.toUpperCase())}
            onBlur={() => handleBlur("vin")}
            error={errorFor("vin")}
            className="md:col-span-2"
          />
        )}
      </div>

      {state.status === "failed" && (
        <p role="alert" className="rounded-control border border-danger p-4 text-small font-semibold text-danger">
          {state.message}
        </p>
      )}

      <div className="md:grid md:grid-cols-2 md:gap-x-8">
        <Button type="submit" fullWidth pending={pending} disabled={!filled && !pending} className="md:col-start-2">
          Guardar y continuar
        </Button>
      </div>
    </form>
  );
}
