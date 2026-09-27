"use client";

import { startTransition, useActionState, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { startQuote, type StartQuoteState } from "../actions";
import { detectCategory, normalizePlate } from "../lib/plate";
import { USES_BY_CATEGORY, VEHICLE_USES, type DocumentType } from "../lib/vehicle-rules";
import { parseStartQuote, type FieldErrors, type StartQuoteField } from "../schema";
import { CategoryTiles } from "./category-tiles";
import { DocumentField } from "./document-field";

const PRIVACY_POLICY_HREF = "#"; // TODO: URL pending (PENDIENTES.md)
const CONSENT_HREF = "#"; // TODO: URL pending (PENDIENTES.md)

// `null` marks a field the user fixed after a server error, so the stale message hides.
type ClientErrors = Partial<Record<StartQuoteField, string | null>>;

/** Home form (Figma "Group 9"): plate, document, use, email and consent. */
export function QuoteStartForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const plateRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState<StartQuoteState, FormData>(startQuote, { status: "idle" });
  const [plate, setPlate] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("DNI");
  const [use, setUse] = useState("");
  const [clientErrors, setClientErrors] = useState<ClientErrors>({});

  const category = detectCategory(plate);
  const uses = category ? USES_BY_CATEGORY[category] : [];
  // Derived: a use that no longer applies to the detected category is dropped.
  const selectedUse = uses.some((key) => key === use) ? use : "";

  const serverErrors: FieldErrors = state.status === "invalid" ? state.errors : {};
  const errorFor = (field: StartQuoteField) => {
    const clientError = clientErrors[field];
    return clientError === null ? undefined : (clientError ?? serverErrors[field]);
  };

  function validate(): FieldErrors {
    if (!formRef.current) return {};
    const result = parseStartQuote(Object.fromEntries(new FormData(formRef.current)));
    return result.ok ? {} : result.errors;
  }

  // Validate a field when the user leaves it, not while typing.
  function handleBlur(field: StartQuoteField) {
    const errors = validate();
    setClientErrors((prev) => ({ ...prev, [field]: errors[field] ?? null }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate();
    const fields: StartQuoteField[] = ["plate", "documentType", "documentNumber", "use", "email", "consent"];
    setClientErrors(Object.fromEntries(fields.map((field) => [field, errors[field] ?? null])));

    if (Object.keys(errors).length > 0) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    // Calling the action inside a transition (instead of <form action>) keeps the
    // typed values: React resets uncontrolled forms after a form action.
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <Card tone="surface" className="px-5 pt-7.5 pb-7 md:px-10">
      <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <CategoryTiles detected={category} onTileClick={() => plateRef.current?.focus()} />

        <Input
          ref={plateRef}
          name="plate"
          label="Ingresa tu placa:"
          placeholder="ABC-123"
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={7}
          value={plate}
          onChange={(event) => setPlate(normalizePlate(event.target.value))}
          onBlur={() => handleBlur("plate")}
          error={errorFor("plate")}
          className="mt-2"
        />

        <DocumentField
          documentType={documentType}
          onDocumentTypeChange={setDocumentType}
          onBlur={handleBlur}
          error={errorFor("documentNumber") ?? errorFor("documentType")}
        />

        <Select
          name="use"
          label="Uso:"
          placeholder={category ? "Selecciona el uso" : "Primero ingresa tu placa"}
          disabled={!category}
          value={selectedUse}
          onChange={(event) => setUse(event.target.value)}
          onBlur={() => handleBlur("use")}
          error={errorFor("use")}
        >
          {uses.map((key) => (
            <option key={key} value={key}>
              {VEHICLE_USES[key].label}
            </option>
          ))}
        </Select>

        <Input
          name="email"
          type="email"
          label="Correo electrónico:"
          autoComplete="email"
          inputMode="email"
          onBlur={() => handleBlur("email")}
          error={errorFor("email")}
        />

        <p className="mt-4 text-small font-bold text-ink">
          Al continuar aceptas la{" "}
          <a href={PRIVACY_POLICY_HREF} className="text-brand-500 underline">
            Política de Privacidad
          </a>
        </p>

        <Checkbox
          name="consent"
          onChange={() => handleBlur("consent")}
          error={errorFor("consent")}
          label={
            <>
              Acepto el{" "}
              <a href={CONSENT_HREF} className="text-brand-500 underline">
                Consentimiento de datos para usos adicionales
              </a>
            </>
          }
        />

        <Button type="submit" fullWidth pending={pending} className="mt-6">
          Comprar SOAT virtual
        </Button>

        {state.status === "ready" && (
          <p role="status" className="rounded-control bg-brand-50 p-4 text-small font-semibold text-brand-900">
            Datos validados. La consulta de tu placa se conectará en el siguiente paso.
          </p>
        )}
      </form>
    </Card>
  );
}
