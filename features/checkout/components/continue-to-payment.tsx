"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { chargePayment, markOrderPending, startPayment } from "../actions";
import { createCulqiCheckout, loadCulqiCheckout, type CulqiInstance } from "../lib/culqi-checkout";
import type { PaymentError } from "../lib/payment-errors";
import { PaymentDeclined } from "./payment-declined";

type ContinueToPaymentProps = {
  /** Culqi public key (pk_test_… / pk_live_…). */
  publicKey: string;
  /** "Antes de pagar" text, rendered on the server; replaced by the declined screen after a decline. */
  intro: ReactNode;
};

/**
 * "Continuar con el pago" (spec section 8): creates the order through the API and
 * opens Culqi Checkout. Card and Yape return a token that the API charges; the
 * deferred methods return a payment code that Culqi confirms later.
 */
export function ContinueToPayment({ publicKey, intro }: ContinueToPaymentProps) {
  const [error, setError] = useState<Omit<PaymentError, "ok"> | null>(null);
  const [charging, setCharging] = useState(false);
  /** Declines so far: each one remounts the declined screen, which moves focus to its heading. */
  const [declines, setDeclines] = useState(0);
  const [pending, startTransition] = useTransition();

  function handleCulqiResult(culqi: CulqiInstance) {
    if (culqi.token) {
      const token = { id: culqi.token.id, email: culqi.token.email };
      culqi.close();
      setCharging(true);
      startTransition(async () => {
        const result = await chargePayment(token);
        // On success the action redirects to the confirmation.
        if (result && !result.ok) {
          setCharging(false);
          if (result.reason === "declined") setDeclines((count) => count + 1);
          else setError(result);
        }
      });
    } else if (culqi.order) {
      // Culqi keeps showing the payment code; the confirmation opens behind it.
      startTransition(() => markOrderPending());
    }
    // Culqi.error: the checkout shows the problem itself and the person can retry there.
  }

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const script = loadCulqiCheckout().catch(() => null);
      const result = await startPayment();
      if (!result.ok) {
        setError(result);
        return;
      }
      const CulqiCheckout = await script;
      if (!CulqiCheckout) {
        setError({ error: "No pudimos abrir la ventana de pago. Revisa tu conexión e inténtalo de nuevo." });
        return;
      }
      const culqi = createCulqiCheckout(CulqiCheckout, publicKey, result.data.settings, result.data.email);
      culqi.culqi = () => handleCulqiResult(culqi);
      culqi.open();
    });
  }

  const actions = (label: string) => (
    <div className="flex w-full max-w-126 flex-col items-center gap-4">
      <Button className="w-full md:w-auto" pending={pending} onClick={handleClick}>
        {label}
      </Button>
      {/* Always rendered so screen readers announce the message when it appears. */}
      <p role="status" className="empty:hidden text-small font-semibold text-ink-muted">
        {charging && "Procesando tu pago…"}
      </p>
      {error && (
        <div role="alert" className="flex w-full flex-col items-start gap-3 rounded-control border border-danger p-4 text-left">
          <p className="text-small font-semibold text-danger">{error.error}</p>
          {error.link && (
            <Link href={error.link.href} className="text-small font-semibold text-brand-500 underline underline-offset-4">
              {error.link.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );

  if (declines > 0) return <PaymentDeclined key={declines} retry={actions("Intentar nuevamente")} />;

  return (
    <div className="flex flex-col items-center gap-9 text-center">
      {intro}
      {actions("Continuar con el pago")}
    </div>
  );
}
