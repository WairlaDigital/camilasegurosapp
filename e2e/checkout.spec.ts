import { expect, test, type Page } from "@playwright/test";
import { culqiConfigs, mockCulqi } from "./fake-culqi";
import { openBeforePayment as openPaymentStep } from "./flow";

// Checkout: "Continuar con el pago" creates the order (POST /data on the fake API)
// and opens Culqi Checkout (a fake script, see e2e/fake-culqi.ts).

async function openBeforePayment(page: Page, email = "cliente@correo.pe") {
  await mockCulqi(page);
  await openPaymentStep(page, { email });
}

const culqi = (page: Page) => page.getByRole("dialog", { name: "Culqi Checkout" });

test("paying by card shows the confirmation", async ({ page }) => {
  await openBeforePayment(page);
  await page.getByRole("button", { name: "Continuar con el pago" }).click();
  await expect(culqi(page)).toBeVisible();

  const [config] = await culqiConfigs(page);
  expect(config.publicKey).toBe("pk_test_e2e0000000000000");
  expect(config.settings).toMatchObject({ amount: 21000, currency: "PEN" });
  expect(config.settings.order).toMatch(/^ord_test_e2e\d+$/);
  expect(config.client.email).toBe("cliente@correo.pe");

  await culqi(page).getByRole("button", { name: "Pagar con tarjeta", exact: true }).click();
  await expect(page).toHaveURL(/\/cotizar\/confirmacion$/);
  await expect(culqi(page)).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("¡Listo, Martín! Recibimos tu pago");
  await expect(page.getByText("Te enviaremos tu SOAT a cliente@correo.pe en los próximos minutos.")).toBeVisible();
  await expect(page.getByText("Total pagado")).toBeVisible();

  // Paid: going back to "Antes de pagar" cannot start a second payment.
  await page.goto("/cotizar/antes-de-pagar");
  await expect(page).toHaveURL(/\/cotizar\/confirmacion$/);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("a declined card shows what to do and lets the person try again", async ({ page }) => {
  await openBeforePayment(page);
  await page.getByRole("button", { name: "Continuar con el pago" }).click();
  await culqi(page).getByRole("button", { name: "Pagar con tarjeta rechazada" }).click();

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText("No se pudo procesar tu pago");
  await expect(heading).toBeFocused();
  await expect(page).toHaveURL(/\/cotizar\/antes-de-pagar$/);
  await expect(page.getByText("Tu pago fue rechazado. No se ha realizado ningún cobro en tu tarjeta o cuenta.")).toBeVisible();
  await expect(page.getByText("El pago fue rechazado.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "¿Qué puedes hacer?" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(4);

  // "Intentar nuevamente" opens Culqi again (same order), where any method can be chosen.
  await page.getByRole("button", { name: "Intentar nuevamente" }).click();
  await culqi(page).getByRole("button", { name: "Pagar con tarjeta", exact: true }).click();
  await expect(page).toHaveURL(/\/cotizar\/confirmacion$/);

  const configs = await culqiConfigs(page);
  expect(configs[1].settings.order).toBe(configs[0].settings.order);
});

test("trying again reuses the same order", async ({ page }) => {
  await openBeforePayment(page);
  await page.getByRole("button", { name: "Continuar con el pago" }).click();
  await culqi(page).getByRole("button", { name: "Cerrar" }).click();
  await page.getByRole("button", { name: "Continuar con el pago" }).click();
  await expect(culqi(page)).toBeVisible();

  const configs = await culqiConfigs(page);
  expect(configs).toHaveLength(2);
  expect(configs[1].settings.order).toBe(configs[0].settings.order);
});

test("a deferred payment code shows the pending order", async ({ page }) => {
  await openBeforePayment(page);
  await page.getByRole("button", { name: "Continuar con el pago" }).click();
  await culqi(page).getByRole("button", { name: "Generar código de pago" }).click();

  // Culqi keeps showing the code; the confirmation is behind it.
  await expect(page).toHaveURL(/\/cotizar\/confirmacion$/);
  await culqi(page).getByRole("button", { name: "Cerrar" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tu código de pago está listo");
  await expect(page.getByText("Total a pagar")).toBeVisible();

  // The person can still pay by card instead.
  await page.getByRole("link", { name: "Prefiero pagar con tarjeta o Yape" }).click();
  await expect(page).toHaveURL(/\/cotizar\/antes-de-pagar$/);
});

test("an email the API rejects explains what to do", async ({ page }) => {
  await openBeforePayment(page, "cliente@sin-dns.pe");
  await page.getByRole("button", { name: "Continuar con el pago" }).click();

  const alert = page.getByRole("main").getByRole("alert");
  await expect(alert).toContainText("No pudimos validar tu correo electrónico. Vuelve al inicio y escribe otro correo.");
  await expect(culqi(page)).toBeHidden();
  await alert.getByRole("link", { name: "Volver al inicio" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("an expired session explains it and links back to the start", async ({ page }) => {
  await openBeforePayment(page);
  await page.context().clearCookies(); // the 2-hour quote session ran out

  await page.getByRole("button", { name: "Continuar con el pago" }).click();
  const alert = page.getByRole("main").getByRole("alert");
  await expect(alert).toContainText("Tu sesión expiró. Vuelve a ingresar tu placa para cotizar.");
  await expect(culqi(page)).toBeHidden();

  await alert.getByRole("link", { name: "Volver a cotizar" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("without an order the confirmation goes back to the payment", async ({ page }) => {
  await openBeforePayment(page);
  await page.goto("/cotizar/confirmacion");
  await expect(page).toHaveURL(/\/cotizar\/antes-de-pagar$/);
});
