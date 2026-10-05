import { expect, test, type Page } from "@playwright/test";
import { openVehicleStep, submitHome } from "./flow";

// Vehicle data (Figma 267:24): step 2/3, always shown after the holder data. What
// the plate lookup returned is locked; the person completes the rest. Runs against
// the fake API (e2e/mock-api), whose example plates drive each case.

const openVehicleForm = openVehicleStep;
const startQuote = submitHome;

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

test("a complete vehicle is shown locked and continues to the quote without quoting again", async ({ page }) => {
  await openVehicleForm(page, "ABC-123");

  await expect(page.getByRole("link", { name: "Volver. Paso 2 de 3" })).toBeVisible();
  await expect(page.getByLabel("Marca")).toBeDisabled();
  await expect(page.getByLabel("Marca")).toHaveValue("HYUNDAI");
  await expect(page.getByLabel("Modelo")).toHaveValue("ACCENT");
  await expect(page.getByLabel("Versión")).toHaveValue("1.3");
  await expect(page.getByLabel("Nro. de serie")).toBeDisabled();
  await expect(page.getByLabel("VIN")).toHaveValue("VIN1234567890");

  const submit = page.getByRole("button", { name: "Guardar y continuar" });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page).toHaveURL(/\/cotizar\/cotizacion$/);
  await expect(page.getByRole("link", { name: "Volver. Paso 3 de 3" })).toBeVisible();
});

test("an incomplete vehicle locks what the lookup returned and asks for the rest", async ({ page }) => {
  await openVehicleForm(page, "AEF-710");

  await expect(page.getByText("Placa: AEF-710")).toBeVisible();
  const f = vehicleForm(page);
  await expect(f.type).toHaveValue("1");
  await expect(f.use).toHaveValue("5");
  await expect(page.getByLabel("Marca")).toBeDisabled();
  await expect(page.getByLabel("Marca")).toHaveValue("HYUNDAI");
  await expect(f.model).toBeDisabled();
  await expect(f.model).toHaveValue("H1");
  await expect(f.year).toBeDisabled();
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

test("when La Positiva's model list is down the step still opens and says so", async ({ page }) => {
  await openVehicleForm(page, "MOD-503"); // brand from the lookup, no model; the model list answers 503

  await expect(page.getByLabel("Marca")).toHaveValue("KIA");
  const f = vehicleForm(page);
  await expect(f.model).toBeDisabled();
  await expect(f.model.locator("option")).toHaveText(["No pudimos cargar la lista"]);
  await expect(page.getByText("El catálogo no respondió. Inténtalo de nuevo en unos minutos.")).toBeVisible();
  await expect(f.submit).toBeDisabled();
});

test("choosing another brand loads its models and clears model and version", async ({ page }) => {
  await openVehicleForm(page, "ZZZ-999"); // no lookup data: nothing is locked
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
  await openVehicleForm(page, "ZZZ-999");
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
  await f.seats.fill("0"); // the year comes locked from the plate lookup
  await f.seats.blur();
  await expect(page.getByText("Debe ser entre 1 y 99.")).toBeVisible();
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

test("the flow screens need a quote session and the previous steps", async ({ page }) => {
  await page.goto("/cotizar/vehiculo");
  await expect(page).toHaveURL(/\/$/);

  // With a session but without the holder data, the vehicle and quote steps send back to it.
  await submitHome(page, "ABC-123");
  await page.waitForURL(/\/cotizar\/titular$/);
  await page.goto("/cotizar/vehiculo");
  await expect(page).toHaveURL(/\/cotizar\/titular$/);
  await page.goto("/cotizar/cotizacion");
  await expect(page).toHaveURL(/\/cotizar\/titular$/);
});
