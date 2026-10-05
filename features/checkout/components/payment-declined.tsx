import { useEffect, useRef, type ReactNode } from "react";
import Image from "next/image";

const TIPS = [
  {
    icon: { src: "/icons/payment-online-purchases.svg", width: 31, height: 47 },
    title: "Activa tus compras online",
    text: "Activa las compras por internet en la app de tu banco.",
  },
  {
    icon: { src: "/icons/payment-check-card.svg", width: 37, height: 29 },
    title: "Revisa tu tarjeta",
    text: "Revisa los datos de tu tarjeta.",
  },
  {
    icon: { src: "/icons/payment-check-balance.svg", width: 41, height: 36 },
    title: "Verifica tu saldo",
    text: "Verifica tu saldo o límite disponible.",
  },
  {
    icon: { src: "/icons/payment-try-another.svg", width: 44, height: 42 },
    title: "Prueba otra opción",
    text: "Prueba con otra tarjeta o cuenta.",
  },
];

type PaymentDeclinedProps = {
  /** "Intentar nuevamente": opens Culqi Checkout again, where any payment method can be chosen. */
  retry: ReactNode;
};

/**
 * Figma "SOAT al instante 6": Culqi declined the charge. Only for an explicit
 * decline, when nothing was charged; a connection error keeps its own message.
 */
export function PaymentDeclined({ retry }: PaymentDeclinedProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The whole step changes: move focus (and screen readers) to the new heading.
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <div className="flex flex-col items-center gap-7 text-center">
      <Image src="/illustrations/card-error.svg" alt="" width={114} height={71} />

      <div className="flex max-w-120 flex-col gap-4">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-subtitle font-semibold text-ink-strong focus:outline-none lg:text-title"
        >
          {/* Figma breaks before "tu pago" when it does not fit in one line. */}
          No se pudo procesar <span className="whitespace-nowrap">tu pago</span>
        </h1>
        <p className="text-body text-ink-strong lg:text-subtitle">
          Tu pago fue rechazado. No se ha realizado ningún cobro en tu tarjeta o cuenta.
        </p>
      </div>

      <div className="flex w-full max-w-126 items-center gap-4 rounded-control bg-danger-soft px-5 py-4 text-left text-small text-danger-strong">
        <svg aria-hidden viewBox="0 0 24 24" className="size-7 shrink-0 text-danger">
          <circle cx="12" cy="12" r="12" fill="currentColor" />
          <path d="M12 6.5v7" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="12" cy="17.25" r="1.4" fill="white" />
        </svg>
        <p>
          <span className="block font-bold">El pago fue rechazado.</span>
          Por favor, revisa la información e intenta nuevamente.
        </p>
      </div>

      <section className="flex w-full max-w-126 flex-col gap-4 text-left">
        <h2 className="text-subtitle font-semibold text-ink-strong">¿Qué puedes hacer?</h2>
        <ul className="flex flex-col gap-4">
          {TIPS.map((tip) => (
            <li key={tip.title} className="flex items-center gap-4">
              <span className="flex w-11 shrink-0 justify-center">
                <Image src={tip.icon.src} alt="" width={tip.icon.width} height={tip.icon.height} />
              </span>
              <span>
                <span className="block font-semibold text-ink-strong">{tip.title}</span>
                <span className="text-small text-ink">{tip.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {retry}
    </div>
  );
}
