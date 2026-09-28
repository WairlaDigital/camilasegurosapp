"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * "Continuar con el pago" (spec section 8). It will create the order through the
 * API (POST /data) and open Culqi Checkout (see PENDIENTES.md).
 */
export function ContinueToPayment() {
  const [requested, setRequested] = useState(false);

  return (
    <div className="flex flex-col items-start gap-4">
      {/* TODO(checkout): create the order and open Culqi Checkout. */}
      <Button className="w-full md:w-auto" onClick={() => setRequested(true)}>
        Continuar con el pago
      </Button>
      {/* Always rendered so screen readers announce the message when it appears. */}
      <p role="status" className="empty:hidden rounded-control bg-brand-100 p-4 text-small font-semibold text-brand-900">
        {requested && "El pago en línea todavía no está disponible. Escríbenos y te ayudamos a completar tu compra."}
      </p>
    </div>
  );
}
