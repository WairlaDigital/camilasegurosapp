import { expect, test, type Page } from "@playwright/test";

// "Antes de pagar" (spec section 8): informative screen between the quote and the checkout.

async function openQuote(page: Page) {
  await page.goto("/");
  await page.getByLabel("Ingresa tu placa:").fill("ABC-123");
  await page.getByLabel("Número de documento:").fill("12345678");
  await page.getByLabel("Uso:").selectOption("particular");
  await page.getByLabel("Correo electrónico:").fill("cliente@correo.pe");
  await page.getByRole("checkbox", { name: /Consentimiento de datos/ }).check();
  await page.getByRole("button", { name: "Comprar SOAT virtual" }).click();
  await page.waitForURL(/\/cotizar\/cotizacion$/);
}

test("after 'Ir a pagar' it explains the payment and the checkout is not available yet", async ({ page }) => {
  await openQuote(page);
  await page.getByRole("button", { name: /^Lo quiero/ }).click();
  await page.getByLabel("Número de celular").fill("987654321");
  await page.getByRole("button", { name: "Ir a pagar" }).click();

  await expect(page).toHaveURL(/\/cotizar\/antes-de-pagar$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("¡Estás a un paso de obtener tu SOAT!");
  await expect(page.getByText("Completa el pago y recibe tu SOAT en pocos minutos.")).toBeVisible();
  await expect(page.getByRole("main").getByRole("listitem")).toHaveText([
    "Recibirás en tu correo el código y las indicaciones para efectuar el pago.",
    "Si pagas en un agente, consulta sus horarios de atención antes de acercarte.",
  ]);

  // TODO(checkout): replace once the payment provider is decided.
  await page.getByRole("button", { name: "Continuar con el pago" }).click();
  await expect(page.getByRole("status")).toContainText("El pago en línea todavía no está disponible");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("without a chosen plan it goes back to the quote", async ({ page }) => {
  await openQuote(page);
  await page.goto("/cotizar/antes-de-pagar");
  await expect(page).toHaveURL(/\/cotizar\/cotizacion$/);
});

test("without a quote session it goes to the home page", async ({ page }) => {
  await page.goto("/cotizar/antes-de-pagar");
  await expect(page).toHaveURL(/\/$/);
});
