import { expect, test, type Page } from "@playwright/test";

// "Completa los datos del titular" (Figma 433:174): after the quote, only the
// fields POST /data accepts. The API's values are shown locked.

async function openHolderForm(page: Page, { ruc = false } = {}) {
  await page.goto("/");
  await page.getByLabel("Ingresa tu placa:").fill("ABC-123");
  if (ruc) await page.getByLabel("Tipo de documento").selectOption("RUC");
  await page.getByLabel("Número de documento:").fill(ruc ? "20123456789" : "12345678");
  await page.getByLabel("Uso:").selectOption("particular");
  await page.getByLabel("Correo electrónico:").fill("cliente@correo.pe");
  await page.getByRole("checkbox", { name: /Consentimiento de datos/ }).check();
  await page.getByRole("button", { name: "Comprar SOAT virtual" }).click();
  await page.waitForURL(/\/cotizar\/cotizacion$/);
  await page.getByRole("button", { name: /^Lo quiero/ }).click();
  await page.getByLabel("Número de celular").fill("987654321");
  await page.getByRole("button", { name: "Ir a pagar" }).click();
  await page.waitForURL(/\/cotizar\/titular$/);
}

test("with DNI the names come locked and the address is asked", async ({ page }) => {
  await openHolderForm(page);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Completa los datos del titular");
  await expect(page.getByLabel("Nro. de documento")).toHaveValue("12345678");
  await expect(page.getByLabel("Nombres", { exact: true })).toBeDisabled();
  await expect(page.getByLabel("Nombres", { exact: true })).toHaveValue("MARTÍN JAVIER");
  await expect(page.getByLabel("Apellidos", { exact: true })).toHaveValue("RODRIGUEZ GONZALES");

  const submit = page.getByRole("button", { name: "Guardar y continuar" });
  await expect(submit).toBeDisabled(); // address, department and district are missing

  await page.getByLabel("Domicilio").fill("Av 1");
  await page.getByLabel("Domicilio").blur();
  await expect(page.getByText("Escribe la dirección completa (calle y número).")).toBeVisible();

  await page.getByLabel("Domicilio").fill("Av. Primavera 1234");
  await page.getByLabel("Departamento").selectOption("Lima");
  await page.getByLabel("Distrito").fill("Santiago de Surco");
  await submit.click();
  await expect(page).toHaveURL(/\/cotizar\/antes-de-pagar$/);

  // Back from "Antes de pagar", the data is still there.
  await page.getByRole("link", { name: "Volver. Paso 3 de 3" }).click();
  await expect(page).toHaveURL(/\/cotizar\/titular$/);
  await expect(page.getByLabel("Distrito")).toHaveValue("Santiago de Surco");
});

test("with RUC the company and its address come locked and a contact name is asked", async ({ page }) => {
  await openHolderForm(page, { ruc: true });

  await expect(page.getByLabel("Razón social")).toHaveValue("TRANSPORTES LIMA S.A.C.");
  await expect(page.getByLabel("Dirección")).toBeDisabled();
  await expect(page.getByLabel("Dirección")).toHaveValue("AV. JAVIER PRADO ESTE 123");
  await expect(page.getByLabel("Departamento")).toHaveValue("LIMA");

  await page.getByLabel("Apellidos del contacto").fill("O'Brien");
  await page.getByLabel("Apellidos del contacto").blur();
  await expect(page.getByText("Solo letras y espacios.")).toBeVisible();

  await page.getByLabel("Apellidos del contacto").fill("Quispe Mamani");
  await page.getByLabel("Nombres del contacto").fill("Rosa");
  await page.getByRole("button", { name: "Guardar y continuar" }).click();
  await expect(page).toHaveURL(/\/cotizar\/antes-de-pagar$/);
});

test("the holder form needs a chosen plan", async ({ page }) => {
  await page.goto("/cotizar/titular");
  await expect(page).toHaveURL(/\/$/);
});
