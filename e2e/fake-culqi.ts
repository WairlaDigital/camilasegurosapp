import type { Page } from "@playwright/test";

// Stand-in for Culqi Checkout (https://js.culqi.com/checkout-js): e2e never load
// the real script nor reach Culqi. It keeps the same surface the front uses
// (new CulqiCheckout(key, config), open, close, culqi callback, token/order) and
// renders a small dialog whose buttons play each outcome. Every config it was
// opened with is kept in window.__culqiConfigs for assertions.

const FAKE_CULQI = `
window.__culqiConfigs = window.__culqiConfigs || [];
window.CulqiCheckout = class {
  constructor(publicKey, config) {
    this.publicKey = publicKey;
    this.config = config;
    this.token = null;
    this.order = null;
    this.error = null;
  }
  open() {
    window.__culqiConfigs.push({ publicKey: this.publicKey, ...this.config });
    const dialog = document.createElement("div");
    dialog.id = "fake-culqi";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-label", "Culqi Checkout");
    dialog.style.cssText = "position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;gap:8px;padding:24px;background:white";
    const email = this.config.client.email;
    const outcomes = [
      ["Pagar con tarjeta", () => { this.token = { id: "tkn_test_0123456789abcd", email }; }],
      ["Pagar con tarjeta rechazada", () => { this.token = { id: "tkn_test_declined0123456", email }; }],
      ["Generar código de pago", () => { this.order = { id: this.config.settings.order }; }],
    ];
    for (const [label, play] of outcomes) {
      const button = document.createElement("button");
      button.textContent = label;
      button.onclick = () => { play(); this.culqi && this.culqi(); };
      dialog.append(button);
    }
    const close = document.createElement("button");
    close.textContent = "Cerrar";
    close.onclick = () => this.close();
    dialog.append(close);
    document.body.append(dialog);
  }
  close() {
    document.getElementById("fake-culqi")?.remove();
  }
};
`;

export type FakeCulqiConfig = {
  publicKey: string;
  settings: { title: string; currency: string; amount: number; order: string };
  client: { email: string };
};

export async function mockCulqi(page: Page) {
  await page.route("https://js.culqi.com/**", (route) =>
    route.fulfill({ contentType: "application/javascript", body: FAKE_CULQI }),
  );
}

declare global {
  interface Window {
    __culqiConfigs?: FakeCulqiConfig[];
  }
}

export function culqiConfigs(page: Page): Promise<FakeCulqiConfig[]> {
  return page.evaluate(() => window.__culqiConfigs ?? []);
}
