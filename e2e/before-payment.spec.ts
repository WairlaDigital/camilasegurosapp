import { expect, test, type Page } from "@playwright/test";

// "Antes de pagar" (spec section 8): informative screen between the holder data and the checkout.

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

async function choosePlan(page: Page) {
  await page.getByRole("button", { name: /^Lo quiero/ }).click();
  await page.getByLabel("Número de celular").fill("987654321");
  await page.getByRole("button", { name: "Ir a pagar" }).click();
  await page.waitForURL(/\/cotizar\/titular$/);
}

test("after the holder data it explains the payment", async ({ page }) => {
  await openQuote(page);
  await choosePlan(page);
  await page.getByLabel("Domicilio").fill("Av. Primavera 1234");
  await page.getByLabel("Departamento").selectOption("Lima");
  await page.getByLabel("Distrito").fill("Santiago de Surco");
  await page.getByRole("button", { name: "Guardar y continuar" }).click();

  await expect(page).toHaveURL(/\/cotizar\/antes-de-pagar$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("¡Tu SOAT está casi listo!");
  await expect(
    page.getByText("Completa el pago de forma segura y recibe tu póliza en tu correo en pocos minutos."),
  ).toBeVisible();
  await expect(page.getByRole("main").getByRole("listitem")).toHaveText([
    "Tu póliza se emite apenas se confirme el pago.",
    "Te la enviamos en PDF al correo que registraste. Si no la ves, revisa tu bandeja de spam o promociones.",
  ]);
  // The payment itself: e2e/checkout.spec.ts.
  await expect(page.getByRole("button", { name: "Continuar con el pago" })).toBeEnabled();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("without a chosen plan it goes back to the quote", async ({ page }) => {
  await openQuote(page);
  await page.goto("/cotizar/antes-de-pagar");
  await expect(page).toHaveURL(/\/cotizar\/cotizacion$/);
});

test("without the holder data it goes to the holder form", async ({ page }) => {
  await openQuote(page);
  await choosePlan(page);
  await page.goto("/cotizar/antes-de-pagar");
  await expect(page).toHaveURL(/\/cotizar\/titular$/);
});

test("without a quote session it goes to the home page", async ({ page }) => {
  await page.goto("/cotizar/antes-de-pagar");
  await expect(page).toHaveURL(/\/$/);
});
