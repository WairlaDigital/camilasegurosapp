// Home copy from Figma. Items marked "provisional" need approval (see PENDIENTES.md).

export const heroBenefits = ["Entrega inmediata", "Compra segura", "100% digital", "Disponibilidad 24/7"] as const;

// Amounts in UIT as shown in Figma (UIT = S/ 5,500).
export const coverages = [
  { title: "Cobertura por Fallecimiento", amount: "Hasta 4 UIT o S/ 22,000" },
  { title: "Cobertura por Gastos Médicos", amount: "Hasta 5 UIT o S/ 27,500" },
  { title: "Cobertura por Incapacidad Temporal", amount: "Hasta 1 UIT o S/ 5,500" },
  { title: "Cobertura por Invalidez Permanente", amount: "Hasta 4 UIT o S/ 22,000" },
  { title: "Cobertura por Gastos de Sepelio", amount: "Hasta 1 UIT o S/ 5,500" },
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
