"use client";

import { startTransition, useActionState, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanCard } from "@/features/plans/components/plan-card";
import type { PlanSummary } from "@/types/quote";
import { addDays } from "../lib/dates";
import { confirmQuote, type ConfirmQuoteState } from "../quote-actions";
import {
  MAX_START_DAYS,
  normalizePhone,
  parseQuoteForm,
  type QuoteField,
  type QuoteFieldErrors,
} from "../quote-schema";

type QuoteFormProps = {
  plans: PlanSummary[];
  /** YYYY-MM-DD in Lima, from the server. */
  today: string;
  initial: { planId: number | null; startDate: string; phone: string };
};

const FIELDS: QuoteField[] = ["planId", "startDate", "phone"];

/** Figma "Cotización" (240:117): plan cards with "LO QUIERO", start date, phone and "IR A PAGAR". */
export function QuoteForm({ plans, today, initial }: QuoteFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const dateTitleRef = useRef<HTMLHeadingElement>(null);
  const [state, formAction, pending] = useActionState<ConfirmQuoteState, FormData>(confirmQuote, { status: "idle" });
  const [planId, setPlanId] = useState(initial.planId);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [phone, setPhone] = useState(initial.phone);
  const [clientErrors, setClientErrors] = useState<Partial<Record<QuoteField, string | null>>>({});

  const planIds = plans.map((plan) => plan.id);
  const filled = planId !== null && startDate !== "" && phone !== "";

  const serverErrors: QuoteFieldErrors = state.status === "invalid" ? state.errors : {};
  const errorFor = (field: QuoteField) => {
    const clientError = clientErrors[field];
    return clientError === null ? undefined : (clientError ?? serverErrors[field]);
  };

  function validate(): QuoteFieldErrors {
    if (!formRef.current) return {};
    const result = parseQuoteForm(Object.fromEntries(new FormData(formRef.current)), { today, planIds });
    return result.ok ? {} : result.errors;
  }

  function handleBlur(field: QuoteField) {
    const errors = validate();
    setClientErrors((prev) => ({ ...prev, [field]: errors[field] ?? null }));
  }

  function choosePlan(id: number) {
    setPlanId(id);
    setClientErrors((prev) => ({ ...prev, planId: null }));
    // Next step of the screen: the start date. A heading (not the date input)
    // takes the focus so mobile browsers do not open the date picker by themselves.
    dateTitleRef.current?.focus();
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

  const planError = errorFor("planId");

  return (
    <>
      <section aria-labelledby="plans-title" className="w-full">
        <h2 id="plans-title" className="sr-only">
          {plans.length > 1 ? "Elige tu plan" : "Tu plan"}
        </h2>
        <ul className="flex flex-wrap justify-center gap-8">
          {plans.map((plan) => {
            const selected = plan.id === planId;
            return (
              <li key={plan.id} className="w-full md:w-88">
                <PlanCard plan={plan} selected={selected} className="h-full">
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    aria-pressed={selected}
                    aria-label={`${selected ? "Elegido" : "Lo quiero"}: ${plan.product} ${plan.insurer}`.trim()}
                    onClick={() => choosePlan(plan.id)}
                  >
                    {selected ? "Elegido" : "Lo quiero"}
                  </Button>
                </PlanCard>
              </li>
            );
          })}
        </ul>
      </section>

      <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-8 md:max-w-88">
        <input type="hidden" name="planId" value={planId ?? ""} />

        <div className="flex flex-col gap-4">
          <h2 ref={dateTitleRef} tabIndex={-1} className="text-subtitle font-medium text-ink-strong focus:outline-none">
            ¿Cuándo iniciamos tu protección?
          </h2>
          <Input
            type="date"
            name="startDate"
            label="Selecciona una fecha"
            variant="inset"
            min={today}
            max={addDays(today, MAX_START_DAYS)}
            required
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            onBlur={() => handleBlur("startDate")}
            error={errorFor("startDate")}
            hint="Si cambias la fecha, confirmamos el precio de nuevo."
          />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-subtitle font-medium text-ink-strong">Información del contacto</h2>
          <Input
            type="tel"
            name="phone"
            label="Número de celular"
            variant="inset"
            inputMode="numeric"
            autoComplete="tel-national"
            required
            value={phone}
            onChange={(event) => setPhone(normalizePhone(event.target.value))}
            onBlur={() => handleBlur("phone")}
            error={errorFor("phone")}
          />
        </div>

        <div className="flex flex-col gap-4">
          {planError && (
            <p role="alert" className="rounded-control border border-danger p-4 text-small font-semibold text-danger">
              {planError}
            </p>
          )}
          {state.status === "failed" && (
            <p role="alert" className="rounded-control border border-danger p-4 text-small font-semibold text-danger">
              {state.message}
            </p>
          )}
          {state.status === "repriced" && (
            <p role="status" className="rounded-control bg-brand-100 p-4 text-small font-semibold text-brand-900">
              {state.message}
            </p>
          )}

          <Button type="submit" fullWidth pending={pending} disabled={!filled && !pending}>
            Ir a pagar
          </Button>
          {planId === null && <p className="text-small text-ink-muted">Elige tu plan con «Lo quiero» para continuar.</p>}
        </div>
      </form>
    </>
  );
}
