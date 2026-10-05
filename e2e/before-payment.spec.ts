import { expect, test } from "@playwright/test";
import { openBeforePayment, openHolderStep, openQuote, openVehicleStep } from "./flow";

// "Antes de pagar" (spec section 8): informative screen between the quote (3/3) and the checkout.

test("after the quote it explains the payment", async ({ page }) => {
  await openBeforePayment(page);
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

test("without the earlier steps it goes back to the first one missing", async ({ page }) => {
  await openHolderStep(page);
  await page.goto("/cotizar/antes-de-pagar");
  await expect(page).toHaveURL(/\/cotizar\/titular$/);

  await page.goto("/");
  await openVehicleStep(page);
  await page.goto("/cotizar/antes-de-pagar");
  await expect(page).toHaveURL(/\/cotizar\/vehiculo$/);
});

test("without a quote session it goes to the home page", async ({ page }) => {
  await page.goto("/cotizar/antes-de-pagar");
  await expect(page).toHaveURL(/\/$/);
});
