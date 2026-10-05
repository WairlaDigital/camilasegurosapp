import { expect, test } from "@playwright/test";
import { openHolderStep } from "./flow";

// "Completa los datos del titular" (Figma 433:174): step 1/3, right after the home
// form and before the plans. The API's values are shown locked.

test("with DNI the names come locked and the address and contact are asked", async ({ page }) => {
  await openHolderStep(page);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Completa los datos del titular");
  await expect(page.getByRole("link", { name: "Volver. Paso 1 de 3" })).toBeVisible();
  await expect(page.getByText("Placa: ABC-123")).toBeVisible();
  await expect(page.getByLabel("Tipo de persona")).toHaveValue("Natural");
  await expect(page.getByLabel("Nro. de documento")).toHaveValue("12345678");
  await expect(page.getByLabel("Nombres", { exact: true })).toBeDisabled();
  await expect(page.getByLabel("Nombres", { exact: true })).toHaveValue("MARTÍN JAVIER");
  await expect(page.getByLabel("Apellidos", { exact: true })).toHaveValue("RODRIGUEZ GONZALES");
  await expect(page.getByLabel("Correo electrónico")).toHaveValue("cliente@correo.pe"); // from the home form

  const submit = page.getByRole("button", { name: "Guardar y continuar" });
  await expect(submit).toBeDisabled(); // address, department, district and phone are missing

  await page.getByLabel("Domicilio").fill("Av 1");
  await page.getByLabel("Domicilio").blur();
  await expect(page.getByText("Escribe la dirección completa (calle y número).")).toBeVisible();
  await page.getByLabel("Domicilio").fill("Av. Primavera 1234");
  await page.getByLabel("Referencia (Urb, Av.) (opcional)").fill("Urb. Los Álamos");

  // Lima and Callao only; the province follows the department and the district list too.
  const district = page.getByLabel("Distrito");
  await expect(district).toBeDisabled();
  await page.getByLabel("Departamento").selectOption("Callao");
  await expect(page.getByLabel("Provincia")).toHaveValue("Callao");
  await expect(district.locator("option")).toHaveText([
    "Selecciona el distrito",
    "Bellavista",
    "Callao",
    "Carmen de la Legua Reynoso",
    "La Perla",
    "La Punta",
    "Ventanilla",
  ]);
  await page.getByLabel("Departamento").selectOption("Lima");
  await expect(page.getByLabel("Provincia")).toHaveValue("Lima");
  await district.selectOption("Santiago de Surco");

  // At most 9 digits; a pasted +51 prefix is dropped.
  const phone = page.getByLabel("Teléfono celular");
  await phone.pressSequentially("98765432112");
  await expect(phone).toHaveValue("987654321");
  await phone.fill("+51 987 654 321");
  await expect(phone).toHaveValue("987654321");

  await submit.click();
  await expect(page).toHaveURL(/\/cotizar\/vehiculo$/);

  // Back from the vehicle step, the data is still there.
  await page.getByRole("link", { name: "Volver. Paso 2 de 3" }).click();
  await expect(page).toHaveURL(/\/cotizar\/titular$/);
  await expect(page.getByLabel("Distrito")).toHaveValue("Santiago de Surco");
  await expect(page.getByLabel("Referencia (Urb, Av.) (opcional)")).toHaveValue("Urb. Los Álamos");
  await expect(page.getByLabel("Teléfono celular")).toHaveValue("987654321");
});

test("with RUC the company and its address come locked and a contact name is asked", async ({ page }) => {
  await openHolderStep(page, "ABC-123", { ruc: true });

  await expect(page.getByLabel("Tipo de persona")).toHaveValue("Jurídica");
  await expect(page.getByLabel("Razón social")).toHaveValue("TRANSPORTES LIMA S.A.C.");
  await expect(page.getByLabel("Dirección")).toBeDisabled();
  await expect(page.getByLabel("Dirección")).toHaveValue("AV. JAVIER PRADO ESTE 123");
  await expect(page.getByLabel("Departamento")).toHaveValue("LIMA");
  await expect(page.getByLabel("Provincia")).toHaveValue("Lima");
  await expect(page.getByLabel("Distrito")).toHaveValue("SAN ISIDRO");

  await page.getByLabel("Apellidos del contacto").fill("O'Brien");
  await page.getByLabel("Apellidos del contacto").blur();
  await expect(page.getByText("Solo letras y espacios.")).toBeVisible();

  await page.getByLabel("Apellidos del contacto").fill("Quispe Mamani");
  await page.getByLabel("Nombres del contacto").fill("Rosa");
  await page.getByLabel("Teléfono celular").fill("987654321");
  await page.getByRole("button", { name: "Guardar y continuar" }).click();
  await expect(page).toHaveURL(/\/cotizar\/vehiculo$/);
});

test("the holder form needs a quote session", async ({ page }) => {
  await page.goto("/cotizar/titular");
  await expect(page).toHaveURL(/\/$/);
});
