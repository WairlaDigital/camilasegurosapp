import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/features/quote/lib/dates";
import { greetingName } from "@/features/quote/lib/greeting";
import { readQuoteSession } from "@/features/quote/session";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Confirmación" };

// After the payment: not in Figma nor in the spec (flujo.md, step 8). There is no
// endpoint for the policy status, so it can only say what comes next by email.
export default async function ConfirmationPage() {
  const session = await readQuoteSession();
  if (!session) redirect("/");
  const { order, input, request, result, selection, holderDetails } = session;
  if (!order || order.status === "created") redirect("/cotizar/antes-de-pagar");

  const paid = order.status === "paid";
  const name = greetingName(holderDetails ? { firstName: holderDetails.firstName } : result.holder);
  const plan = result.plans.find((candidate) => candidate.id === selection?.planId);
  const email = holderDetails?.email ?? input.email;

  const summary = [
    { label: "Placa", value: input.plate },
    { label: "Inicio de vigencia", value: formatDate(request.startDate) },
    ...(plan ? [{ label: paid ? "Total pagado" : "Total a pagar", value: formatMoney(plan.priceCents) }] : []),
  ];

  const notes = paid
    ? [
        `Te enviaremos tu SOAT a ${email} en los próximos minutos.`,
        "Si no lo encuentras, revisa tu carpeta de correo no deseado.",
      ]
    : [
        `Recibirás en ${email} el código y las indicaciones para efectuar el pago.`,
        "Págalo en tu banca móvil, un agente o una billetera dentro de las próximas 24 horas.",
        "Cuando se confirme el pago, te enviaremos tu SOAT por correo.",
      ];

  return (
    <Container className="flex flex-col items-center gap-9 pt-12 pb-24 text-center lg:pt-24 lg:pb-40">
      <div className="flex flex-col gap-4">
        <h1 className="text-subtitle font-medium text-ink-strong lg:text-title">
          {paid ? `¡Listo${name ? `, ${name}` : ""}! Recibimos tu pago` : "Tu código de pago está listo"}
        </h1>
        <p className="text-body text-ink-strong lg:text-subtitle">
          {paid ? "Estamos emitiendo tu SOAT." : "Tu SOAT se emitirá cuando pagues."}
        </p>
      </div>

      <Card tone="outlined" className="w-full max-w-112 text-left">
        <dl className="flex flex-col gap-3">
          {summary.map((item) => (
            <div key={item.label} className="flex justify-between gap-4">
              <dt className="text-ink-muted">{item.label}</dt>
              <dd className="font-semibold text-ink-strong">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <ul className="flex max-w-112 flex-col gap-3 text-left">
        {notes.map((note) => (
          <li key={note} className="flex gap-2">
            <Image src="/icons/check-circle.svg" alt="" width={19} height={20} className="mt-0.5 shrink-0 self-start" />
            <span className="min-w-0 break-words">{note}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-center gap-4">
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          Volver al inicio
        </Link>
        {!paid && (
          <Link href="/cotizar/antes-de-pagar" className="font-semibold text-brand-500 underline underline-offset-4">
            Prefiero pagar con tarjeta o Yape
          </Link>
        )}
      </div>
    </Container>
  );
}
