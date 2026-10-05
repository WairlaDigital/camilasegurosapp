"use client";

import { startTransition, useActionState, useRef, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanCard } from "@/features/plans/components/plan-card";
import type { PlanSummary } from "@/types/quote";
import { addDays, formatDate } from "../lib/dates";
import { confirmQuote, requoteForDate, type ConfirmQuoteState } from "../quote-actions";
import { MAX_START_DAYS, parseQuoteForm, startDateError, type QuoteField, type QuoteFieldErrors } from "../quote-schema";

type QuoteFormProps = {
  plans: PlanSummary[];
  /** YYYY-MM-DD in Lima, from the server. */
  today: string;
  initial: {
    planId: number | null;
    /** Shown in the date field (today when the quoted date already passed). */
    startDate: string;
    /** The date the shown prices were quoted for. */
    quotedStartDate: string;
  };
};

/** Wait after the last date change before quoting, so typing a date quotes it once. */
const REQUOTE_DELAY_MS = 600;

const FIELDS: QuoteField[] = ["planId", "startDate"];

/**
 * Figma "Cotización" (240:117): plan cards with "LO QUIERO", start date and "IR A
 * PAGAR". The phone Figma shows here is asked once, in the holder data (step 1/3).
 */
export function QuoteForm({ plans: initialPlans, today, initial }: QuoteFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const dateTitleRef = useRef<HTMLHeadingElement>(null);
  const [state, formAction, pending] = useActionState<ConfirmQuoteState, FormData>(confirmQuote, { status: "idle" });
  const [planId, setPlanId] = useState(initial.planId);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [clientErrors, setClientErrors] = useState<Partial<Record<QuoteField, string | null>>>({});
  // A new start date is quoted right away: the cards show the price for it.
  const [plans, setPlans] = useState(initialPlans);
  const [quotedDate, setQuotedDate] = useState(initial.quotedStartDate);
  const [requoteNotice, setRequoteNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [requoting, startRequote] = useTransition();
  /** From the date change (including the short wait) until the new quote arrives. */
  const [awaitingQuote, setAwaitingQuote] = useState(false);
  const quoting = awaitingQuote || requoting;
  const requoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requoteRun = useRef(0);

  const planIds = plans.map((plan) => plan.id);
  const filled = planId !== null && startDate !== "";

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

  function changeStartDate(value: string) {
    setStartDate(value);
    setRequoteNotice(null);
    if (requoteTimer.current) clearTimeout(requoteTimer.current);
    if (startDateError(value, today) || value === quotedDate) {
      requoteRun.current += 1; // a quote still running is no longer wanted
      setAwaitingQuote(false);
      return;
    }
    setAwaitingQuote(true);
    requoteTimer.current = setTimeout(() => {
      const run = ++requoteRun.current;
      startRequote(async () => {
        const result = await requoteForDate(value);
        if (run !== requoteRun.current) return; // a newer date is being quoted
        setAwaitingQuote(false);
        if (result.ok) {
          setPlans(result.plans);
          // A plan the new quote no longer offers is not chosen anymore (the server drops it too).
          setPlanId((current) => (result.plans.some((plan) => plan.id === current) ? current : null));
          setQuotedDate(result.startDate);
          setRequoteNotice(result.message ? { ok: true, text: result.message } : null);
        } else {
          setRequoteNotice({ ok: false, text: result.error });
        }
      });
    }, REQUOTE_DELAY_MS);
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
      <section aria-labelledby="plans-title" aria-busy={quoting} className="w-full">
        <h2 id="plans-title" className="sr-only">
          {plans.length > 1 ? "Elige tu plan" : "Tu plan"}
        </h2>
        {/* Always rendered so screen readers announce it when the new quote starts. */}
        <p role="status" className="sr-only">
          {quoting ? `Cotizando tu SOAT para el ${formatDate(startDate)}…` : ""}
        </p>
        <ul className="flex flex-wrap justify-center gap-8">
          {plans.map((plan) => {
            const selected = plan.id === planId;
            return (
              <li key={plan.id} className="w-full md:w-88">
                <PlanCard
                  plan={plan}
                  selected={selected}
                  quotingLabel={quoting ? `Cotizando para el ${formatDate(startDate)}…` : undefined}
                  className="h-full"
                >
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    aria-pressed={selected}
                    disabled={quoting}
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
            onChange={(event) => changeStartDate(event.target.value)}
            onBlur={() => handleBlur("startDate")}
            error={errorFor("startDate")}
            hint="Si cambias la fecha, volvemos a cotizar tu SOAT para ese día."
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
          {!quoting && requoteNotice && (
            <p
              role={requoteNotice.ok ? "status" : "alert"}
              className={
                requoteNotice.ok
                  ? "rounded-control bg-brand-100 p-4 text-small font-semibold text-brand-900"
                  : "rounded-control border border-danger p-4 text-small font-semibold text-danger"
              }
            >
              {requoteNotice.text}
            </p>
          )}
          {state.status === "repriced" && (
            <p role="status" className="rounded-control bg-brand-100 p-4 text-small font-semibold text-brand-900">
              {state.message}
            </p>
          )}

          <Button type="submit" fullWidth pending={pending || quoting} disabled={!filled && !pending}>
            Ir a pagar
          </Button>
          {planId === null && <p className="text-small text-ink-muted">Elige tu plan con «Lo quiero» para continuar.</p>}
        </div>
      </form>
    </>
  );
}
