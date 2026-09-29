import { expect, test, type Page } from "@playwright/test";

// Home → plate lookup → "Datos incompletos" → vehicle data form (Figma 267:24).
// Runs against the fake API (e2e/mock-api), whose example plates drive each case.

type StartOptions = { use?: string; ruc?: boolean; documentNumber?: string };

async function startQuote(page: Page, plate: string, { use = "particular", ruc = false, documentNumber }: StartOptions = {}) {
  await page.goto("/");
  await page.getByLabel("Ingresa tu placa:").fill(plate);
  if (ruc) await page.getByLabel("Tipo de documento").selectOption("RUC");
  await page.getByLabel("Número de documento:").fill(documentNumber ?? (ruc ? "20123456789" : "12345678"));
  await page.getByLabel("Uso:").selectOption(use);
  await page.getByLabel("Correo electrónico:").fill("cliente@correo.pe");
  await page.getByRole("checkbox", { name: /Consentimiento de datos/ }).check();
  await page.getByRole("button", { name: "Comprar SOAT virtual" }).click();
}

/** Goes through the real flow so the quote session cookie is set before the form loads. */
async function openVehicleForm(page: Page, plate: string, options?: StartOptions) {
  await startQuote(page, plate, options);
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

test("an auto plate only offers auto types, and a single use has no selector", async ({ page }) => {
  await openVehicleForm(page, "AEF-710");
  const f = vehicleForm(page);

  // Spec 4.1: the category is fixed by the plate (no Mototaxi, Motocicleta or Motocarga).
  await expect(f.type.locator("option")).toHaveText([
    "Selecciona el tipo",
    "AUTOMÓVIL",
    "CAMIONETA HASTA 7 ASIENTOS",
    "MINIVAN (9 A 16 ASIENTOS)",
  ]);
  await expect(f.use.locator("option")).toHaveText(["Selecciona el uso", "TAXI", "PARTICULAR"]);

  await f.type.selectOption("8"); // Minivan: only Particular in the catalog
  await expect(f.use).toBeDisabled();
  await expect(f.use).toHaveValue("PARTICULAR");
  await expect(page.getByText("Es el único uso posible para este tipo de vehículo.")).toBeVisible();
});

test("a moto plate only offers moto types; Motocarga is Carga only (spec section 2)", async ({ page }) => {
  await openVehicleForm(page, "1234-AB", { use: "carga" });
  const f = vehicleForm(page);

  await expect(f.type.locator("option")).toHaveText(["Selecciona el tipo", "MOTOTAXI", "MOTOCICLETA", "MOTOCARGA"]);
  await expect(f.type).toHaveValue("16");
  await expect(f.use).toBeDisabled();
  await expect(f.use).toHaveValue("CARGA");

  await f.type.selectOption("2"); // Mototaxi: Particular or Taxi
  await expect(f.use.locator("option")).toHaveText(["Selecciona el uso", "PARTICULAR", "TAXI"]);
});

test("with RUC, a moto lineal cannot be Particular (spec 4.2)", async ({ page }) => {
  await openVehicleForm(page, "1234-AB", { ruc: true });
  const f = vehicleForm(page);

  await expect(f.type).toHaveValue("10"); // Motocicleta
  await expect(f.use).toBeDisabled();
  await expect(page.getByText(/Con RUC, una moto lineal solo puede tener uso Comercial/)).toBeVisible();
  await expect(f.submit).toBeDisabled();

  await f.type.selectOption("2"); // the rule is only for moto lineal
  await expect(f.use.locator("option")).toHaveText(["Selecciona el uso", "PARTICULAR", "TAXI"]);
});

test("a registration that contradicts the plate format stops with a clear message (spec 4.1)", async ({ page }) => {
  await startQuote(page, "MOT-123");
  await expect(alertWith(page, "Según el registro vehicular, esta placa es de una moto")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
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

test("the catalog endpoints need a quote session and are rate limited", async ({ page }, testInfo) => {
  const anonymous = await page.request.get("/api/vehicles/brands?search=hyu");
  expect(anonymous.status()).toBe(401);

  // The limit counts per person (document + plate): a document of its own keeps
  // this test from exhausting the limit of the tests running in parallel.
  const documentNumber = testInfo.project.name === "mobile" ? "11111111" : "22222222";
  await openVehicleForm(page, "AEF-710", { documentNumber }); // page.request now carries the session cookie
  const statuses: number[] = [];
  for (let i = 0; i < 61; i += 1) {
    statuses.push((await page.request.get(`/api/vehicles/brands?search=hy${i}`)).status());
  }
  expect(statuses.slice(0, 60).every((status) => status === 200)).toBe(true);
  expect(statuses[60]).toBe(429);
  const limited = await page.request.get("/api/vehicles/brands?search=hyu");
  expect(limited.status()).toBe(429);
  expect(Number(limited.headers()["retry-after"])).toBeGreaterThan(0);
});

test("the flow screens need a quote session", async ({ page }) => {
  await page.goto("/cotizar/vehiculo");
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/cotizar/datos-incompletos");
  await expect(page).toHaveURL(/\/$/);
});
