import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { Pill } from "@/components/ui/pill";
import { Radio } from "@/components/ui/radio";
import { Select } from "@/components/ui/select";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

// Class names must be literal so Tailwind generates them.
const colors = [
  { name: "brand-50", className: "bg-brand-50" },
  { name: "brand-100", className: "bg-brand-100" },
  { name: "brand-200", className: "bg-brand-200" },
  { name: "brand-400", className: "bg-brand-400" },
  { name: "brand-500", className: "bg-brand-500" },
  { name: "brand-700", className: "bg-brand-700" },
  { name: "brand-900", className: "bg-brand-900" },
  { name: "ink", className: "bg-ink" },
  { name: "ink-soft", className: "bg-ink-soft" },
  { name: "ink-muted", className: "bg-ink-muted" },
  { name: "placeholder", className: "bg-placeholder" },
  { name: "line", className: "bg-line" },
  { name: "line-soft", className: "bg-line-soft" },
  { name: "field-disabled", className: "bg-field-disabled" },
  { name: "sand", className: "bg-sand" },
  { name: "success", className: "bg-success" },
  { name: "info", className: "bg-info" },
  { name: "danger", className: "bg-danger" },
];

const typeScale = [
  { name: "display · 42", className: "text-display font-medium", sample: "SOAT al Instante" },
  { name: "title · 32", className: "text-title font-medium", sample: "Conoce las coberturas" },
  { name: "subtitle · 20", className: "text-subtitle font-bold", sample: "SOAT La Positiva" },
  { name: "body · 16", className: "text-body", sample: "Recíbelo al momento en tu email." },
  { name: "label · 16", className: "text-label font-bold", sample: "Ingresa tu placa:" },
  { name: "small · 14", className: "text-small font-bold", sample: "Al continuar aceptas la Política de Privacidad" },
  { name: "caption · 12", className: "text-caption font-semibold uppercase", sample: "Paso 3/3" },
  { name: "nav · 13", className: "text-nav font-bold uppercase text-ink-soft", sample: "Principal" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6 border-t border-line-soft py-10">
      <h2 className="text-title font-medium text-ink-strong">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <Container className="py-12">
      <h1 className="text-display font-medium text-ink-strong">Design system</h1>
      <p className="mt-3 text-ink-muted">Solo desarrollo. Lineamientos en DESIGN.md.</p>

      <Section title="Color">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {colors.map((c) => (
            <li key={c.name} className="flex flex-col gap-2">
              <span className={`h-16 rounded-control border border-line-soft ${c.className}`} />
              <span className="text-small font-semibold">{c.name}</span>
            </li>
          ))}
        </ul>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-16 rounded-control bg-gradient-primary" />
          <div className="h-16 rounded-control bg-gradient-secondary" />
          <div className="h-16 rounded-control border border-line-soft bg-gradient-page" />
        </div>
      </Section>

      <Section title="Tipografía">
        <ul className="flex flex-col gap-5">
          {typeScale.map((t) => (
            <li key={t.name} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="w-32 shrink-0 text-caption text-ink-muted">{t.name}</span>
              <span className={t.className}>{t.sample}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Botones">
        <div className="flex flex-wrap items-center gap-4">
          <Button>Comprar SOAT virtual</Button>
          <Button size="md">Contáctanos</Button>
          <Button pending>Procesando</Button>
          <Button disabled>Deshabilitado</Button>
        </div>
        <div className="max-w-sm rounded-card bg-brand-500 p-8">
          <Button variant="secondary" size="md" fullWidth>
            Lo quiero
          </Button>
        </div>
      </Section>

      <Section title="Campos">
        <div className="grid gap-6 md:grid-cols-2">
          <Input name="plate" label="Ingresa tu placa:" placeholder="ABC-123" />
          <Input name="email" type="email" label="Correo electrónico:" error="Ingresa un correo válido." defaultValue="soat@" />
          <Select name="use" label="Uso:" placeholder="Seleccione uso" defaultValue="">
            <option value="5">Particular</option>
            <option value="1">Taxi</option>
          </Select>
          <Input name="doc" label="Número de documento:" hint="DNI: 8 dígitos." inputMode="numeric" />
          <Select name="vehicle-use" label="Tipo de uso" variant="inset" defaultValue="5">
            <option value="5">PARTICULAR</option>
            <option value="1">TAXI</option>
          </Select>
          <Input name="brand" label="Marca" variant="inset" defaultValue="HYUNDAI" />
          <Input name="person-type" label="Tipo de persona" variant="inset" defaultValue="Natural" disabled />
          <Input name="last-name" label="Apellido Paterno" variant="inset" defaultValue="RODRIGUEZ" disabled />
          <Input name="start-date" label="Selecciona una fecha" variant="inset" type="date" />
          <Input name="year" label="Año de fabricación" variant="inset" error="Año fuera de rango." defaultValue="1970" />
        </div>
        <div className="flex flex-col gap-4">
          <Checkbox
            name="consent"
            label={
              <>
                Acepto el{" "}
                <a href="#" className="text-brand-500 underline">
                  Consentimiento de datos para usos adicionales
                </a>
              </>
            }
          />
          <Checkbox name="consent-error" label="Consentimiento obligatorio" error="Debes aceptar para continuar." />
          <fieldset className="flex flex-col gap-3">
            <legend className="text-body font-medium text-ink-strong">¿Comprobante de pago a nombre del contratante?</legend>
            <div className="flex gap-8">
              <Radio name="receipt" value="yes" label="Sí" />
              <Radio name="receipt" value="no" label="No" defaultChecked />
            </div>
          </fieldset>
        </div>
      </Section>

      <Section title="Pills">
        <div className="flex flex-wrap items-center gap-4">
          <Pill>Coberturas</Pill>
          <Pill tone="step">
            <Image src="/icons/step-back.svg" alt="" width={16} height={16} />
            Paso 3/3
          </Pill>
          <span className="rounded-card bg-brand-500 p-4">
            <Pill tone="light">
              Seguros \ SOAT
              <Image src="/icons/chevron-right.svg" alt="" width={7.5} height={13.5} />
            </Pill>
          </span>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-6 md:grid-cols-3">
          <Card tone="outlined" className="flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-tile bg-brand-500">
              <Image src="/icons/car.svg" alt="" width={52} height={24} />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-bold text-brand-500">HYUNDAI H-1 2013</p>
              <p className="font-semibold text-brand-500">
                Placa: <span className="text-ink-strong">AEF-710</span>
              </p>
              <a href="#" className="inline-flex items-center gap-1.5 font-bold text-brand-500">
                <Image src="/icons/edit.svg" alt="" width={18} height={18} />
                Editar
              </a>
            </div>
          </Card>
          <Card tone="brand" padding="lg" className="flex flex-col gap-4">
            <p className="text-subtitle font-bold">
              SOAT
              <br />
              La Positiva
            </p>
            <p className="text-title font-medium">S/ 210.00</p>
            <ul className="flex flex-col gap-1.5">
              {["Coberturas por ley", "Cobertura a nivel nacional"].map((f) => (
                <li key={f} className="flex items-center justify-between gap-3 font-medium">
                  {f}
                  <Image src="/icons/check-circle.svg" alt="Incluido" width={18.8} height={19.97} />
                </li>
              ))}
            </ul>
          </Card>
          <Card tone="brand-panel" padding="lg" className="flex flex-col justify-end gap-1">
            <p className="font-bold">Cobertura por Fallecimiento</p>
            <p className="text-small">Hasta 4 UIT o S/ 22,000</p>
          </Card>
        </div>
      </Section>

      <Section title="Acordeón">
        <div className="rounded-panel bg-brand-100 px-5 py-10 md:px-10">
          <Accordion className="max-w-136">
            <AccordionItem name="faq" title="¿Recibo mi SOAT al instante?" open>
              Sí, apenas se confirma tu pago, tu SOAT llega automáticamente a tu correo o WhatsApp, listo para usar.
            </AccordionItem>
            <AccordionItem name="faq" title="¿Mi SOAT virtual tiene la misma validez que el físico?">
              Sí, tiene la misma validez.
            </AccordionItem>
            <AccordionItem name="faq" title="¿Cuánto cuesta el SOAT y de qué depende el precio?">
              Depende del tipo y uso de tu vehículo.
            </AccordionItem>
          </Accordion>
        </div>
      </Section>

      <Section title="Logo">
        <div className="flex flex-wrap items-center gap-8">
          <Logo />
          <span className="rounded-card bg-brand-900 p-6">
            <Logo tone="light" />
          </span>
        </div>
      </Section>
    </Container>
  );
}
