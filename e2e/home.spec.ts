import { expect, test, type Page } from "@playwright/test";

// Home screen and quote start form (Figma "SOAT al instante" / "Home Mobile").

function form(page: Page) {
  return {
    plate: page.getByLabel("Ingresa tu placa:"),
    documentType: page.getByLabel("Tipo de documento"),
    documentNumber: page.getByLabel("Número de documento:"),
    use: page.getByLabel("Uso:"),
    email: page.getByLabel("Correo electrónico:"),
    consent: page.getByRole("checkbox", { name: /Consentimiento de datos/ }),
    submit: page.getByRole("button", { name: "Comprar SOAT virtual" }),
    autoTile: page.getByRole("radio", { name: /Autos, camionetas y camiones/ }),
    motoTile: page.getByRole("radio", { name: /Motos, mototaxis y trimotos/ }),
  };
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("shows the hero, the form, coverages and FAQ without horizontal scroll", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1, name: /SOAT al Instante/ })).toBeVisible();
  await expect(form(page).submit).toBeVisible();
  await expect(page.getByRole("heading", { name: /coberturas de tu SOAT/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "¿Quieres saber más?" })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("submitting empty shows every error and focuses the first field", async ({ page }) => {
  const f = form(page);
  await f.submit.click();

  await expect(page.getByText("Ingresa tu placa.")).toBeVisible();
  await expect(page.getByText("Ingresa tu número de documento.")).toBeVisible();
  await expect(page.getByText("Selecciona el uso de tu vehículo.")).toBeVisible();
  await expect(page.getByText("Ingresa un correo válido.")).toBeVisible();
  await expect(page.getByText("Debes aceptar el consentimiento para continuar.")).toBeVisible();
  await expect(f.plate).toBeFocused();
  await expect(f.plate).toHaveAttribute("aria-invalid", "true");
});

test("the plate detects the category and filters the uses", async ({ page }) => {
  const f = form(page);
  await expect(f.use).toBeDisabled();

  await f.plate.fill("1234ab");
  await expect(f.plate).toHaveValue("1234AB");
  await expect(f.motoTile).toBeChecked();
  await expect(f.autoTile).not.toBeChecked();
  await expect(f.use).toBeEnabled();
  await expect(f.use.locator("option")).toHaveText(["Selecciona el uso", "Particular", "Taxi", "Comercial", "Carga"]);

  await f.plate.fill("abc-123");
  await expect(f.autoTile).toBeChecked();
  await expect(f.use.locator("option")).toHaveText(["Selecciona el uso", "Particular", "Taxi", "Carga"]);
});

test("category tiles are read-only: clicking one sends the user to the plate", async ({ page }) => {
  const f = form(page);
  await expect(page.getByText("Se marca sola al ingresar tu placa.")).toBeVisible();

  // The tile is the label of a disabled radio, which Playwright treats as "not enabled";
  // a real click still reaches the tile's handler, so skip the actionability check.
  await page.getByText("Motos, mototaxis y trimotos").click({ force: true });
  await expect(f.plate).toBeFocused();
  await expect(f.motoTile).not.toBeChecked();
  await expect(f.autoTile).not.toBeChecked();

  await f.plate.fill("1234-AB");
  await expect(page.getByText("Tipo de vehículo detectado: Motos, mototaxis y trimotos.")).toBeAttached();

  // Clicking the other tile does not override the plate detection.
  await page.getByText("Autos, camionetas y camiones").click({ force: true });
  await expect(f.motoTile).toBeChecked();
  await expect(f.autoTile).not.toBeChecked();
});

test("a use that no longer applies is cleared when the category changes", async ({ page }) => {
  const f = form(page);
  await f.plate.fill("1234-AB");
  await f.use.selectOption("comercial");
  await f.plate.fill("ABC-123");
  await expect(f.use).toHaveValue("");
});

test("validates the document on blur and submits a valid form keeping the values", async ({ page }) => {
  const f = form(page);
  await f.plate.fill("ABC-123");
  await f.documentType.selectOption("RUC");
  await f.documentNumber.fill("30123");
  await f.documentNumber.blur();
  await expect(page.getByText("El RUC tiene 11 dígitos y empieza con 10 o 20.")).toBeVisible();

  await f.documentNumber.fill("20123456789");
  await f.documentNumber.blur();
  await expect(page.getByText(/El RUC tiene 11 dígitos/)).toBeHidden();

  await f.use.selectOption("taxi");
  await f.email.fill("cliente@correo.pe");
  await f.consent.check();
  await f.submit.click();

  // ABC-123 is a complete vehicle in the fake API.
  await expect(page.getByRole("status")).toContainText("Tus datos están completos");
  await expect(f.plate).toHaveValue("ABC-123");
  await expect(f.documentNumber).toHaveValue("20123456789");
  await expect(f.email).toHaveValue("cliente@correo.pe");
  await expect(f.consent).toBeChecked();
});

test("FAQ opens one answer at a time", async ({ page }) => {
  const faq = page.locator("details");
  const first = faq.filter({ hasText: "¿Recibo mi SOAT al instante?" });
  const second = faq.filter({ hasText: "¿Mi SOAT virtual tiene la misma validez" });

  await expect(first).toHaveAttribute("open", "");
  await second.locator("summary").click();
  await expect(second).toHaveAttribute("open", "");
  await expect(first).not.toHaveAttribute("open", "");
});
