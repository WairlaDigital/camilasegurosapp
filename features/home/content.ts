// Home copy from Figma. Items marked "provisional" need approval (see PENDIENTES.md).

// Icons exported from Figma (natural size kept; do not resize the SVGs).
export const heroBenefits = [
  { label: "Entrega Inmediata", icon: { src: "/icons/benefit-delivery.svg", width: 48, height: 49 } },
  { label: "Compra Segura", icon: { src: "/icons/benefit-secure.svg", width: 46, height: 55 } },
  { label: "100% Digital", icon: { src: "/icons/benefit-digital.svg", width: 38, height: 57 } },
  { label: "Disponibilidad 24/7", icon: { src: "/icons/benefit-availability.svg", width: 48, height: 48 } },
] as const;

// Amounts in UIT as shown in Figma (UIT = S/ 5,500). Titles are the two desktop lines from Figma;
// mobile wraps naturally. "S/" and the amount never split (non-breaking space).
export const coverages = [
  {
    titleLines: ["Cobertura por", "Fallecimiento"],
    amount: "Hasta 4 UIT o S/\u00a022,000",
    icon: { src: "/icons/coverage-death.svg", width: 48, height: 52 },
  },
  {
    titleLines: ["Cobertura por", "Gastos Médicos"],
    amount: "Hasta 5 UIT o S/\u00a027,500",
    icon: { src: "/icons/coverage-medical.svg", width: 62, height: 54 },
  },
  {
    titleLines: ["Cobertura por", "Incapacidad Temporal"],
    amount: "Hasta 1 UIT o S/\u00a05,500",
    icon: { src: "/icons/coverage-temporary-disability.svg", width: 48, height: 57 },
  },
  {
    titleLines: ["Cobertura por", "Invalidez Permanente"],
    amount: "Hasta 4 UIT o S/\u00a022,000",
    icon: { src: "/icons/coverage-permanent-disability.svg", width: 52, height: 54 },
  },
  {
    titleLines: ["Cobertura por Gastos", "de Sepelio"],
    amount: "Hasta 1 UIT o S/\u00a05,500",
    icon: { src: "/icons/coverage-funeral.svg", width: 70, height: 39 },
  },
] as const;

export const faqs = [
  {
    question: "¿Recibo mi SOAT al instante?",
    answer:
      "Sí, apenas se confirma tu pago, tu SOAT llega automáticamente a tu correo o WhatsApp, listo para usar.",
  },
  // Answers below are provisional: Figma only has the questions.
  {
    question: "¿Mi SOAT virtual tiene la misma validez que el físico?",
    answer: "Sí. El SOAT electrónico tiene la misma validez legal que el certificado físico.",
  },
  {
    question: "¿Cuánto cuesta el SOAT y de qué depende el precio?",
    answer: "El precio depende del tipo y uso de tu vehículo. Ingresa tu placa y te mostramos el precio al instante.",
  },
  {
    question: "¿Qué es el SOAT y para qué sirve?",
    answer:
      "Es el Seguro Obligatorio de Accidentes de Tránsito. Cubre a las personas que resulten afectadas en un accidente en el que participe tu vehículo.",
  },
  {
    question: "¿Cuánto dura la vigencia de mi SOAT?",
    answer: "Un año desde la fecha de inicio que elijas al comprarlo.",
  },
  {
    question: "¿Cómo verifico cuándo vence mi SOAT?",
    answer: "La fecha de vencimiento figura en tu certificado, que te enviamos al correo al completar la compra.",
  },
] as const;
