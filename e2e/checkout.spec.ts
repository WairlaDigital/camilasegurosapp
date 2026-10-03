import { expect, test, type Page } from "@playwright/test";
import { culqiConfigs, mockCulqi } from "./fake-culqi";

// Checkout: "Continuar con el pago" creates the order (POST /data on the fake API)
// and opens Culqi Checkout (a fake script, see e2e/fake-culqi.ts).

async function openBeforePayment(page: Page, email = "cliente@correo.pe") {
  await mockCulqi(page);
  await page.goto("/");
  await page.getByLabel("Ingresa tu placa:").fill("ABC-123");
  await page.getByLabel("Número de documento:").fill("12345678");
  await page.getByLabel("Uso:").selectOption("particular");
  await page.getByLabel("Correo electrónico:").fill(email);
  await page.getByRole("checkbox", { name: /Consentimiento de datos/ }).check();
  await page.getByRole("button", { name: "Comprar SOAT virtual" }).click();
  await page.waitForURL(/\/cotizar\/cotizacion$/);

  await page.getByRole("button", { name: /^Lo quiero/ }).click();
  await page.getByLabel("Número de celular").fill("987654321");
  await page.getByRole("button", { name: "Ir a pagar" }).click();
  await page.waitForURL(/\/cotizar\/titular$/);

  await page.getByLabel("Domicilio").fill("Av. Primavera 1234");
  await page.getByLabel("Departamento").selectOption("Lima");
  await page.getByLabel("Distrito").fill("Santiago de Surco");
  await page.getByRole("button", { name: "Guardar y continuar" }).click();
  await page.waitForURL(/\/cotizar\/antes-de-pagar$/);
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

test("a declined card keeps the person on the page with a message", async ({ page }) => {
  await openBeforePayment(page);
  await page.getByRole("button", { name: "Continuar con el pago" }).click();
  await culqi(page).getByRole("button", { name: "Pagar con tarjeta rechazada" }).click();

  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "No pudimos procesar tu pago. Revisa los datos de tu tarjeta o prueba con otro medio de pago.",
  );
  await expect(page).toHaveURL(/\/cotizar\/antes-de-pagar$/);
  await expect(page.getByRole("button", { name: "Continuar con el pago" })).toBeEnabled();
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
