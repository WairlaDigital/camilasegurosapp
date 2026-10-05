import type { Page } from "@playwright/test";

// The quote flow as a person goes through it (Figma order): home → holder (1/3) →
// vehicle (2/3, always) → quote (3/3) → "Antes de pagar". Each step needs the
// quote session cookie set by the previous one.

export type StartOptions = { use?: string; ruc?: boolean; documentNumber?: string; email?: string };

export async function submitHome(
  page: Page,
  plate: string,
  { use = "particular", ruc = false, documentNumber, email = "cliente@correo.pe" }: StartOptions = {},
) {
  await page.goto("/");
  await page.getByLabel("Ingresa tu placa:").fill(plate);
  if (ruc) await page.getByLabel("Tipo de documento").selectOption("RUC");
  await page.getByLabel("Número de documento:").fill(documentNumber ?? (ruc ? "20123456789" : "12345678"));
  await page.getByLabel("Uso:").selectOption(use);
  await page.getByLabel("Correo electrónico:").fill(email);
  await page.getByRole("checkbox", { name: /Consentimiento de datos/ }).check();
  await page.getByRole("button", { name: "Comprar SOAT virtual" }).click();
}

export async function openHolderStep(page: Page, plate = "ABC-123", options?: StartOptions) {
  await submitHome(page, plate, options);
  await page.waitForURL(/\/cotizar\/titular$/);
}

/**
 * Fills what the fake API does not return: with DNI the address and phone; with
 * RUC (the company and its address come from SUNAT) a contact name and the phone.
 */
export async function completeHolder(page: Page, { ruc = false } = {}) {
  if (ruc) {
    await page.getByLabel("Apellidos del contacto").fill("Quispe Mamani");
    await page.getByLabel("Nombres del contacto").fill("Rosa");
  } else {
    await page.getByLabel("Domicilio").fill("Av. Primavera 1234");
    await page.getByLabel("Departamento").selectOption("Lima");
    await page.getByLabel("Distrito").selectOption("Santiago de Surco");
  }
  await page.getByLabel("Teléfono celular").fill("987654321");
  await page.getByRole("button", { name: "Guardar y continuar" }).click();
  await page.waitForURL(/\/cotizar\/vehiculo$/);
}

export async function openVehicleStep(page: Page, plate = "ABC-123", options?: StartOptions) {
  await openHolderStep(page, plate, options);
  await completeHolder(page, { ruc: options?.ruc });
}

/** For plates the fake API returns complete: the vehicle step only confirms. */
export async function openQuote(page: Page, plate = "ABC-123", options?: StartOptions) {
  await openVehicleStep(page, plate, options);
  await page.getByRole("button", { name: "Guardar y continuar" }).click();
  await page.waitForURL(/\/cotizar\/cotizacion$/);
}

export async function openBeforePayment(page: Page, options?: StartOptions) {
  await openQuote(page, "ABC-123", options);
  await page.getByRole("button", { name: /^Lo quiero/ }).click();
  await page.getByRole("button", { name: "Ir a pagar" }).click();
  await page.waitForURL(/\/cotizar\/antes-de-pagar$/);
}
