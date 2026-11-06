import { expect, test } from "@playwright/test";

// Site footer: company data, contact, customer service and the complaints book.

test("shows the contact data and the complaints book on every screen size", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");

  await expect(footer.getByText("RUC: 20601241341")).toBeVisible();
  await expect(footer.getByRole("link", { name: "WhatsApp 908 855 202" })).toHaveAttribute(
    "href",
    "https://wa.me/51908855202",
  );
  await expect(footer.getByRole("link", { name: "soporte@seguroscamila.pe" })).toHaveAttribute(
    "href",
    "mailto:soporte@seguroscamila.pe",
  );
  await expect(footer.getByRole("link", { name: /Ca\. Francisco La Rosa 138/ })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Libro de reclamaciones" })).toBeVisible();
});

test("shows the customer service links on desktop only", async ({ page }, testInfo) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  const heading = footer.getByRole("heading", { name: "Atención al cliente" });

  if (testInfo.project.name === "mobile") {
    await expect(heading).toBeHidden();
    return;
  }
  await expect(heading).toBeVisible();
  for (const name of ["Términos y Condiciones", "Política de Privacidad", "Anulaciones y Devoluciones"]) {
    await expect(footer.getByRole("link", { name })).toBeVisible();
  }
});
