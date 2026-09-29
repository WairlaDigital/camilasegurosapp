"use client";

import { startTransition, useActionState, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { saveHolder, type SaveHolderState } from "../holder-actions";
import {
  DEPARTMENTS,
  HOLDER_FIELDS,
  parseHolderForm,
  type HolderField,
  type HolderFieldErrors,
  type HolderFormValues,
} from "../holder-schema";

type HolderFormProps = {
  document: { type: string; number: string };
  /** Razón social (RUC): the names asked are then those of a contact person. */
  companyName?: string;
  /** Values the API returned: shown disabled, never sent. */
  locked: Partial<HolderFormValues>;
  /** What the person completed before (back from "Antes de pagar"). */
  initial: Partial<HolderFormValues>;
};

/** Figma "Completa los datos del titular" (433:174), only with the fields the API accepts. */
export function HolderForm({ document, companyName, locked, initial }: HolderFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<SaveHolderState, FormData>(saveHolder, { status: "idle" });
  const [values, setValues] = useState<Record<HolderField, string>>({
    firstName: initial.firstName ?? "",
    lastName: initial.lastName ?? "",
    address: initial.address ?? "",
    state: initial.state ?? "",
    district: initial.district ?? "",
  });
  const [clientErrors, setClientErrors] = useState<Partial<Record<HolderField, string | null>>>({});

  const isCompany = Boolean(companyName);
  const filled = HOLDER_FIELDS.every((field) => locked[field] || values[field].trim() !== "");

  const serverErrors: HolderFieldErrors = state.status === "invalid" ? state.errors : {};
  const errorFor = (field: HolderField) => {
    const clientError = clientErrors[field];
    return clientError === null ? undefined : (clientError ?? serverErrors[field]);
  };

  function validate(): HolderFieldErrors {
    if (!formRef.current) return {};
    const result = parseHolderForm(Object.fromEntries(new FormData(formRef.current)), locked);
    return result.ok ? {} : result.errors;
  }

  function handleBlur(field: HolderField) {
    const errors = validate();
    setClientErrors((prev) => ({ ...prev, [field]: errors[field] ?? null }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      // `null` hides a stale server error on a field that is now valid.
      setClientErrors(Object.fromEntries(HOLDER_FIELDS.map((field) => [field, errors[field] ?? null])));
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    // Valid: let the Server Action's field errors (if any) show.
    setClientErrors({});
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  /** A field the API already filled: read-only, not submitted (the server keeps the API's value). */
  const lockedField = (field: HolderField, label: string, className?: string) => (
    <Input name={field} label={label} variant="inset" disabled value={locked[field] ?? ""} readOnly className={className} />
  );

  const textField = (field: HolderField, label: string, props: { autoComplete?: string; className?: string } = {}) =>
    locked[field] ? (
      lockedField(field, label, props.className)
    ) : (
      <Input
        name={field}
        label={label}
        variant="inset"
        autoComplete={props.autoComplete}
        className={props.className}
        value={values[field]}
        onChange={(event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))}
        onBlur={() => handleBlur(field)}
        error={errorFor(field)}
      />
    );

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-10">
      <div className="grid gap-5 md:grid-cols-2 md:gap-x-8 lg:grid-cols-3">
        <Input name="documentTypeFixed" label="Tipo de documento" variant="inset" disabled value={document.type} readOnly />
        <Input name="documentNumberFixed" label="Nro. de documento" variant="inset" disabled value={document.number} readOnly />
        {companyName && (
          <Input name="companyNameFixed" label="Razón social" variant="inset" disabled value={companyName} readOnly />
        )}

        {/* Rows as in Figma: document · names · address · department and district. */}
        {textField("lastName", isCompany ? "Apellidos del contacto" : "Apellidos", {
          autoComplete: "family-name",
          className: "lg:col-start-1",
        })}
        {textField("firstName", isCompany ? "Nombres del contacto" : "Nombres", { autoComplete: "given-name" })}

        {textField("address", isCompany ? "Dirección" : "Domicilio", {
          autoComplete: "street-address",
          className: "md:col-span-2 lg:col-start-1",
        })}

        {locked.state ? (
          lockedField("state", "Departamento", "md:col-start-1")
        ) : (
          <Select
            name="state"
            label="Departamento"
            variant="inset"
            className="md:col-start-1"
            placeholder="Selecciona el departamento"
            value={values.state}
            onChange={(event) => setValues((prev) => ({ ...prev, state: event.target.value }))}
            onBlur={() => handleBlur("state")}
            error={errorFor("state")}
          >
            {DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </Select>
        )}
        {textField("district", "Distrito", { autoComplete: "address-level3" })}
      </div>

      {state.status === "failed" && (
        <p role="alert" className="rounded-control border border-danger p-4 text-small font-semibold text-danger">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-8">
        <p className="text-small text-ink-muted">
          {isCompany
            ? "La póliza sale a nombre de la empresa. Además necesitamos el nombre de una persona de contacto."
            : "Los necesitamos para emitir tu póliza."}
        </p>
        <Button type="submit" fullWidth pending={pending} disabled={!filled && !pending} className="md:w-88 md:shrink-0">
          Guardar y continuar
        </Button>
      </div>
    </form>
  );
}
