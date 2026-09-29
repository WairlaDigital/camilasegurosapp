import { expect, test, type Page } from "@playwright/test";

// Quote screen (Figma 240:117): greeting, vehicle summary, plan card, start date,
// phone and "Ir a pagar". The fake API (e2e/mock-api) drives each case by plate.

async function submitHome(page: Page, plate: string, { use = "particular", ruc = false } = {}) {
  await page.goto("/");
  await page.getByLabel("Ingresa tu placa:").fill(plate);
  if (ruc) await page.getByLabel("Tipo de documento").selectOption("RUC");
  await page.getByLabel("Número de documento:").fill(ruc ? "20123456789" : "12345678");
  await page.getByLabel("Uso:").selectOption(use);
  await page.getByLabel("Correo electrónico:").fill("cliente@correo.pe");
  await page.getByRole("checkbox", { name: /Consentimiento de datos/ }).check();
  await page.getByRole("button", { name: "Comprar SOAT virtual" }).click();
}

async function openQuote(page: Page, plate: string, options?: { use?: string; ruc?: boolean }) {
  await submitHome(page, plate, options);
  await page.waitForURL(/\/cotizar\/cotizacion$/);
}

function quoteForm(page: Page) {
  return {
    choose: page.getByRole("button", { name: /^(Lo quiero|Elegido)/ }),
    date: page.getByLabel("Selecciona una fecha"),
    phone: page.getByLabel("Número de celular"),
    submit: page.getByRole("button", { name: "Ir a pagar" }),
  };
}

const limaDate = (offsetDays = 0) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(Date.now() + offsetDays * 86_400_000),
  );

test("a complete vehicle goes straight to the quote with the La Positiva plan only", async ({ page }) => {
  await openQuote(page, "ABC-123");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hola Martín, activa tu SOAT en pocos minutos...");
  await expect(page.getByRole("heading", { name: "HYUNDAI ACCENT 2018" })).toBeVisible();
  await expect(page.getByText("ABC-123")).toBeVisible();
  await expect(page.getByText("Automóvil")).toBeVisible();
  await expect(page.getByText("Particular", { exact: true })).toBeVisible();

  // The fake API also returns an AFOCAT plan: it is not sold here.
  await expect(page.getByRole("heading", { level: 3 })).toHaveText(["SOATLa Positiva"]);
  await expect(page.getByText("S/ 210.00")).toBeVisible();
  await expect(page.getByRole("list", { name: "Coberturas del plan" }).getByRole("listitem")).toHaveCount(5);
  await expect(quoteForm(page).date).toHaveValue(limaDate());

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("'Ir a pagar' needs a plan and a phone, and keeps the choice", async ({ page }) => {
  await openQuote(page, "ABC-123");
  const f = quoteForm(page);

  await expect(f.submit).toBeDisabled();
  await expect(page.getByText("Elige tu plan con «Lo quiero» para continuar.")).toBeVisible();

  await f.choose.click();
  await expect(f.choose).toHaveAttribute("aria-pressed", "true");
  await expect(f.choose).toHaveText("Elegido");
  await expect(page.getByRole("heading", { name: "¿Cuándo iniciamos tu protección?" })).toBeFocused();

  await f.phone.fill("12345");
  await f.phone.blur();
  await expect(page.getByText("Ingresa un celular de 9 dígitos que empiece con 9.")).toBeVisible();

  await f.phone.fill("987 654 321");
  await expect(f.phone).toHaveValue("987654321");
  await f.submit.click();
  await expect(page).toHaveURL(/\/cotizar\/titular$/);

  // Going back keeps the choice (quote session).
  await page.getByRole("link", { name: "Volver. Paso 3 de 3" }).click();
  await expect(page).toHaveURL(/\/cotizar\/cotizacion$/);
  await expect(f.choose).toHaveAttribute("aria-pressed", "true");
  await expect(f.phone).toHaveValue("987654321");
});

test("another start date quotes again and shows the new price before continuing", async ({ page }) => {
  await openQuote(page, "ABC-123");
  const f = quoteForm(page);

  await f.choose.click();
  await f.date.fill(limaDate(1));
  await f.phone.fill("987654321");
  await f.submit.click();

  await expect(page.getByRole("status")).toContainText("el precio es S/ 215.00");
  await expect(page.getByText("S/ 215.00", { exact: true })).toBeVisible();
  await expect(f.date).toHaveValue(limaDate(1));

  await f.submit.click();
  await expect(page).toHaveURL(/\/cotizar\/titular$/);
});

test("'Editar' opens the vehicle form and saving it comes back to the quote", async ({ page }) => {
  await openQuote(page, "ABC-123");

  await page.getByRole("link", { name: "Editar datos del vehículo" }).click();
  await expect(page).toHaveURL(/\/cotizar\/vehiculo$/);
  await page.getByLabel("Nro. de asientos").fill("7");
  await page.getByRole("button", { name: "Guardar y continuar" }).click();

  await expect(page).toHaveURL(/\/cotizar\/cotizacion$/);
  await expect(page.getByText("S/ 210.00")).toBeVisible();
});

test("without a plan for sale it explains it and offers to review the data", async ({ page }) => {
  await openQuote(page, "AFO-123");

  await expect(page.getByRole("heading", { name: "Por ahora no tenemos un SOAT disponible para tu vehículo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ir a pagar" })).toHaveCount(0);
  await page.getByRole("link", { name: "Revisar mis datos" }).click();
  await expect(page).toHaveURL(/\/cotizar\/vehiculo$/);
});

// The vehicle registration (POST /query-plate) gives the real type before quoting.
test("a complete camioneta is quoted as a camioneta, not as the default Automóvil", async ({ page }) => {
  await openQuote(page, "CAM-777");
  await expect(page.getByText("Camioneta hasta 7 asientos")).toBeVisible();
});

test("a complete mototaxi is quoted as a mototaxi, not as the default Motocicleta", async ({ page }) => {
  await openQuote(page, "4321-AB");
  await expect(page.getByText("Mototaxi", { exact: true })).toBeVisible();
});

test("a use that the registered type does not allow is flagged on the home form", async ({ page }) => {
  await submitHome(page, "5555-AB", { use: "taxi" });
  await expect(
    page.getByText("Según el registro vehicular, tu vehículo es de tipo Motocicleta: el uso Taxi no aplica. Elige Particular."),
  ).toBeVisible();
  await expect(page.getByLabel("Uso:")).toHaveAttribute("aria-invalid", "true");
  await expect(page).toHaveURL(/\/$/);
});

test("with RUC, a registered moto lineal cannot be quoted as Particular (spec 4.2)", async ({ page }) => {
  await submitHome(page, "5555-AB", { ruc: true });
  await expect(page.getByText(/Con RUC, una moto lineal solo puede tener uso Comercial/)).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("the quote screen needs a quote session", async ({ page }) => {
  await page.goto("/cotizar/cotizacion");
  await expect(page).toHaveURL(/\/$/);
});
