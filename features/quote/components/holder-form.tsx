"use client";

import { startTransition, useActionState, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { saveHolder, type SaveHolderState } from "../holder-actions";
import {
  HOLDER_FIELDS,
  HOLDER_MAX_LENGTH,
  parseHolderForm,
  type HolderField,
  type HolderFieldErrors,
  type HolderFormValues,
  type LockableHolderField,
} from "../holder-schema";
import { DISTRICTS, HOLDER_STATES, holderState, provinceFor } from "../lib/locations";
import { limitPhone } from "../lib/phone";
import { EMAIL_MAX_LENGTH } from "../schema";

type HolderFormProps = {
  document: { type: string; number: string };
  personType: "Natural" | "Jurídica";
  /** Razón social (RUC): the names asked are then those of a contact person. */
  companyName?: string;
  /** Values the API returned: shown disabled, never sent. */
  locked: Partial<Pick<HolderFormValues, LockableHolderField>>;
  /** What the person completed before (back from a later step), or the email of the home form. */
  initial: Partial<HolderFormValues>;
};

/** Figma "Completa los datos del titular" (433:174), step 1/3. */
export function HolderForm({ document, personType, companyName, locked, initial }: HolderFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<SaveHolderState, FormData>(saveHolder, { status: "idle" });
  const [values, setValues] = useState<Record<HolderField, string>>({
    firstName: initial.firstName ?? "",
    lastName: initial.lastName ?? "",
    address: initial.address ?? "",
    reference: initial.reference ?? "",
    state: initial.state ?? "",
    district: initial.district ?? "",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
  });
  const [clientErrors, setClientErrors] = useState<Partial<Record<HolderField, string | null>>>({});

  const isCompany = Boolean(companyName);
  const currentState = locked.state ?? values.state;
  const knownState = holderState(currentState);
  const province = provinceFor(currentState);
  // The reference is optional; everything else needs a value.
  const filled = HOLDER_FIELDS.every(
    (field) => field === "reference" || (field in locked && locked[field as LockableHolderField]) || values[field].trim() !== "",
  );

  const serverErrors: HolderFieldErrors = state.status === "invalid" ? state.errors : {};
  const errorFor = (field: HolderField) => {
    const clientError = clientErrors[field];
    return clientError === null ? undefined : (clientError ?? serverErrors[field]);
  };

  const setValue = (field: HolderField, value: string) => setValues((prev) => ({ ...prev, [field]: value }));

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

  /** A value the form shows but does not edit: read-only and not submitted. */
  const fixedField = (name: string, label: string, value: string, className?: string) => (
    <Input name={name} label={label} variant="inset" disabled value={value} readOnly className={className} />
  );

  const textField = (
    field: "firstName" | "lastName" | "address" | "reference",
    label: string,
    props: { autoComplete?: string; className?: string } = {},
  ) => {
    const lockedValue = field === "reference" ? undefined : locked[field];
    return lockedValue ? (
      fixedField(field, label, lockedValue, props.className)
    ) : (
      <Input
        name={field}
        label={label}
        variant="inset"
        autoComplete={props.autoComplete}
        maxLength={HOLDER_MAX_LENGTH[field]}
        className={props.className}
        value={values[field]}
        onChange={(event) => setValue(field, event.target.value)}
        onBlur={() => handleBlur(field)}
        error={errorFor(field)}
      />
    );
  };

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-10">
      {/* Rows as in Figma: person and document · names · address · reference · location · contact. */}
      <div className="grid gap-5 md:grid-cols-2 md:gap-x-8 lg:grid-cols-3">
        {fixedField("personTypeFixed", "Tipo de persona", personType)}
        {fixedField("documentTypeFixed", "Tipo de documento", document.type)}
        {fixedField("documentNumberFixed", "Nro. de documento", document.number)}
        {companyName && fixedField("companyNameFixed", "Razón social", companyName, "md:col-span-2 lg:col-start-1")}

        {/* The backend returns the surnames together ("RODRIGUEZ GONZALES"): one field, as it comes. */}
        {textField("lastName", isCompany ? "Apellidos del contacto" : "Apellidos", {
          autoComplete: "family-name",
          className: "lg:col-start-1",
        })}
        {textField("firstName", isCompany ? "Nombres del contacto" : "Nombres", { autoComplete: "given-name" })}

        {textField("address", isCompany ? "Dirección" : "Domicilio", {
          autoComplete: "street-address",
          className: "md:col-span-2 lg:col-start-1",
        })}
        {textField("reference", "Referencia (Urb, Av.) (opcional)", { className: "md:col-span-2 lg:col-start-1" })}

        {locked.state ? (
          fixedField("state", "Departamento", locked.state, "md:col-start-1")
        ) : (
          <Select
            name="state"
            label="Departamento"
            variant="inset"
            className="md:col-start-1"
            placeholder="Selecciona el departamento"
            value={values.state}
            onChange={(event) => {
              const next = event.target.value;
              setValues((prev) => {
                const nextState = holderState(next);
                // A district of the other department no longer applies.
                const keepDistrict = nextState !== null && DISTRICTS[nextState].includes(prev.district);
                return { ...prev, state: next, district: keepDistrict ? prev.district : "" };
              });
            }}
            onBlur={() => handleBlur("state")}
            error={errorFor("state")}
          >
            {HOLDER_STATES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        )}

        {/* Each department offers a single province: it follows the department. */}
        <Select
          name="provinceFixed"
          label="Provincia"
          variant="inset"
          disabled
          placeholder="Primero elige el departamento"
          value={province ?? ""}
          onChange={() => {}}
        >
          {province && <option value={province}>{province}</option>}
        </Select>

        {locked.district ? (
          fixedField("district", "Distrito", locked.district)
        ) : knownState || !currentState ? (
          <Select
            name="district"
            label="Distrito"
            variant="inset"
            disabled={!knownState}
            placeholder={knownState ? "Selecciona el distrito" : "Primero elige el departamento"}
            value={values.district}
            onChange={(event) => setValue("district", event.target.value)}
            onBlur={() => handleBlur("district")}
            error={errorFor("district")}
          >
            {knownState &&
              DISTRICTS[knownState].map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
          </Select>
        ) : (
          // A department outside Lima/Callao returned by SUNAT (RUC): the district is typed.
          <Input
            name="district"
            label="Distrito"
            variant="inset"
            autoComplete="address-level3"
            maxLength={60}
            value={values.district}
            onChange={(event) => setValue("district", event.target.value)}
            onBlur={() => handleBlur("district")}
            error={errorFor("district")}
          />
        )}

        <Input
          name="email"
          type="email"
          label="Correo electrónico"
          variant="inset"
          autoComplete="email"
          inputMode="email"
          maxLength={EMAIL_MAX_LENGTH}
          className="md:col-start-1"
          value={values.email}
          onChange={(event) => setValue("email", event.target.value)}
          onBlur={() => handleBlur("email")}
          error={errorFor("email")}
        />
        <Input
          name="phone"
          type="tel"
          label="Teléfono celular"
          variant="inset"
          inputMode="numeric"
          autoComplete="tel-national"
          value={values.phone}
          onChange={(event) => setValue("phone", limitPhone(event.target.value))}
          onBlur={() => handleBlur("phone")}
          error={errorFor("phone")}
        />
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
