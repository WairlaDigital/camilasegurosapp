import { Container } from "@/components/layout/container";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { SectionHeading } from "@/components/ui/section-heading";
import { faqs } from "../content";

// Figma "¿Quieres saber más?": brand-100 wide panel, 542px accordion, first item open.
export function FaqSection() {
  return (
    <Container width="wide">
      <section aria-labelledby="faq-title" className="rounded-panel bg-brand-100 py-12.5 pb-20 lg:pb-31">
        <Container className="flex flex-col gap-15">
          <SectionHeading eyebrow="Preguntas frecuentes" id="faq-title">
            ¿Quieres saber más?
          </SectionHeading>
          <Accordion className="max-w-135.5">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.question} name="faq" title={faq.question} open={index === 0}>
                {faq.answer}
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </section>
    </Container>
  );
}
