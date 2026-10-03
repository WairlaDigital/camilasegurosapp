// Payment failures the person fixes elsewhere: they come with a link there.

export type PaymentError = { ok: false; error: string; link?: { href: string; label: string } };

export const SESSION_EXPIRED: PaymentError = {
  ok: false,
  error: "Tu sesión expiró. Vuelve a ingresar tu placa para cotizar.",
  link: { href: "/", label: "Volver a cotizar" },
};

/**
 * The start date was quoted for a day that already passed (e.g. the page stayed
 * open past midnight). La Positiva would not issue it after the charge, so the
 * person picks another date first: the quote screen quotes it again.
 */
export function startDateError(startDate: string, today: string): PaymentError | null {
  if (startDate >= today) return null;
  return {
    ok: false,
    error: "La fecha de inicio de tu SOAT ya pasó. Elige otra fecha para confirmar el precio y continuar con el pago.",
    link: { href: "/cotizar/cotizacion", label: "Elegir otra fecha" },
  };
}
