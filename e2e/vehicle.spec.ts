import { expect, test, type Page } from "@playwright/test";

// Home → plate lookup → "Datos incompletos" → vehicle data form (Figma 267:24).
// Runs against the fake API (e2e/mock-api), whose example plates drive each case.

async function startQuote(page: Page, plate: string) {
  await page.goto("/");
  await page.getByLabel("Ingresa tu placa:").fill(plate);
  await page.getByLabel("Número de documento:").fill("12345678");
  await page.getByLabel("Uso:").selectOption("particular");
  await page.getByLabel("Correo electrónico:").fill("cliente@correo.pe");
  await page.getByRole("checkbox", { name: /Consentimiento de datos/ }).check();
  await page.getByRole("button", { name: "Comprar SOAT virtual" }).click();
}

/** Goes through the real flow so the quote session cookie is set before the form loads. */
async function openVehicleForm(page: Page, plate: string) {
  await startQuote(page, plate);
  await page.waitForURL(/\/cotizar\/datos-incompletos$/);
  await page.getByRole("link", { name: "Completa y cotiza" }).click();
  await page.waitForURL(/\/cotizar\/vehiculo$/);
}

/** Next.js adds an empty route announcer with role="alert": match ours by text. */
const alertWith = (page: Page, text: string) => page.getByRole("alert").filter({ hasText: text });

function vehicleForm(page: Page) {
  return {
    use: page.getByLabel("Tipo de uso"),
    type: page.getByLabel("Tipo de vehículo"),
    brand: page.getByRole("combobox", { name: "Marca" }),
    model: page.getByLabel("Modelo"),
    version: page.getByLabel("Versión"),
    seats: page.getByLabel("Nro. de asientos"),
    year: page.getByLabel("Año de fabricación"),
    serial: page.getByLabel("Nro. de serie"),
    vin: page.getByLabel("VIN"),
    submit: page.getByRole("button", { name: "Guardar y continuar" }),
  };
}

test("an incomplete vehicle goes through 'Datos incompletos' to a prefilled form", async ({ page }) => {
  await startQuote(page, "AEF-710");

  await expect(page).toHaveURL(/\/cotizar\/datos-incompletos$/);
  await expect(page.getByRole("heading", { name: "¡Los datos de tu vehículo están incompletos!" })).toBeVisible();
  await page.getByRole("link", { name: "Completa y cotiza" }).click();

  await expect(page).toHaveURL(/\/cotizar\/vehiculo$/);
  await expect(page.getByText("Placa: AEF-710")).toBeVisible();
  const f = vehicleForm(page);
  await expect(f.type).toHaveValue("1");
  await expect(f.use).toHaveValue("5");
  await expect(f.brand).toHaveValue("HYUNDAI");
  await expect(f.model).toHaveValue("1003280");
  await expect(f.year).toHaveValue("2016");
  await expect(f.submit).toBeDisabled(); // version, seats, serial and VIN are missing

  await f.version.selectOption("10009000");
  await f.seats.fill("6");
  await f.serial.fill("kmhnrc87kdj");
  await f.vin.fill("kmhnrc87kdjhhsi87");
  await expect(f.serial).toHaveValue("KMHNRC87KDJ");
  await expect(f.submit).toBeEnabled();
  await f.submit.click();

  await expect(page).toHaveURL(/\/cotizar\/cotizacion$/);
  await expect(page.getByRole("heading", { name: "HYUNDAI H1 2016" })).toBeVisible();
});

test("choosing another brand loads its models and clears model and version", async ({ page }) => {
  await openVehicleForm(page, "AEF-710");
  const f = vehicleForm(page);

  await f.brand.fill("toy");
  await page.getByRole("option", { name: "TOYOTA" }).click();
  await expect(f.brand).toHaveValue("TOYOTA");
  await expect(f.model.locator("option")).toHaveText(["Selecciona el modelo", "YARIS"]);
  await expect(f.model).toHaveValue("");
  await expect(f.version).toBeDisabled();

  await f.model.selectOption("2000001");
  await expect(f.version.locator("option")).toHaveText(["Selecciona la versión", "1.5"]);
});

test("the brand autocomplete works with the keyboard", async ({ page }) => {
  await openVehicleForm(page, "AEF-710");
  const f = vehicleForm(page);

  await f.brand.fill("ho");
  await expect(page.getByRole("option", { name: "HONDA" })).toBeVisible();
  await f.brand.press("ArrowDown");
  await f.brand.press("Enter");
  await expect(f.brand).toHaveValue("HONDA");
  await expect(page.getByRole("listbox")).toBeHidden();
});

test("changing the vehicle type filters the allowed uses", async ({ page }) => {
  await openVehicleForm(page, "AEF-710");
  const f = vehicleForm(page);

  await f.type.selectOption("10"); // Motocicleta: only Particular
  await expect(f.use.locator("option")).toHaveText(["Selecciona el uso", "PARTICULAR"]);
});

test("invalid values show an error when leaving the field", async ({ page }) => {
  await openVehicleForm(page, "AEF-710");
  const f = vehicleForm(page);

  await f.serial.fill("abc");
  await f.serial.blur();
  await expect(page.getByText("Ingresa el número de serie (8 a 20 letras o números).")).toBeVisible();
  await f.year.fill("1970");
  await f.year.blur();
  await expect(page.getByText(/Debe ser entre 1980/)).toBeVisible();
});

test("when the plate lookup fails, the manual data cannot be quoted (backend limitation)", async ({ page }) => {
  await openVehicleForm(page, "ZZZ-999");
  const f = vehicleForm(page);

  await f.brand.fill("hyu");
  await page.getByRole("option", { name: "HYUNDAI" }).click();
  await f.model.selectOption("1003272");
  await f.version.selectOption("10006180");
  await f.seats.fill("5");
  await f.year.fill("2018");
  await f.serial.fill("SERIAL12345");
  await f.vin.fill("VIN1234567890");
  await f.submit.click();

  await expect(alertWith(page, "No pudimos completar la consulta de tu vehículo")).toBeVisible();
});

test("an API failure on the home form shows a retry message", async ({ page }) => {
  await startQuote(page, "ERR-500");
  await expect(alertWith(page, "No pudimos consultar tu placa")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("the flow screens need a quote session", async ({ page }) => {
  await page.goto("/cotizar/vehiculo");
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/cotizar/datos-incompletos");
  await expect(page).toHaveURL(/\/$/);
});
