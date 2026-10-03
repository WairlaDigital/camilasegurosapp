"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { chargePayment, markOrderPending, startPayment } from "../actions";
import { createCulqiCheckout, loadCulqiCheckout, type CulqiInstance } from "../lib/culqi-checkout";
import type { PaymentError } from "../lib/payment-errors";

type ContinueToPaymentProps = {
  /** Culqi public key (pk_test_… / pk_live_…). */
  publicKey: string;
};

/**
 * "Continuar con el pago" (spec section 8): creates the order through the API and
 * opens Culqi Checkout. Card and Yape return a token that the API charges; the
 * deferred methods return a payment code that Culqi confirms later.
 */
export function ContinueToPayment({ publicKey }: ContinueToPaymentProps) {
  const [error, setError] = useState<Omit<PaymentError, "ok"> | null>(null);
  const [charging, setCharging] = useState(false);
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
          setError(result);
          setCharging(false);
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

  return (
    <div className="flex flex-col items-start gap-4">
      <Button className="w-full md:w-auto" pending={pending} onClick={handleClick}>
        Continuar con el pago
      </Button>
      {/* Always rendered so screen readers announce the message when it appears. */}
      <p role="status" className="empty:hidden text-small font-semibold text-ink-muted">
        {charging && "Procesando tu pago…"}
      </p>
      {error && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-control border border-danger p-4">
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
}
