import type { CulqiSettings } from "@/types/checkout";

// Culqi Checkout (https://docs.culqi.com/es/documentacion/checkout/checkout-custom),
// loaded in the browser only when the person decides to pay. It works with the
// public key; the secret key and the charge live in the API.

const SCRIPT_URL = "https://js.culqi.com/checkout-js";

/** What Culqi.token carries that the API needs to charge. */
export type CulqiToken = { id: string; email: string };

type CulqiConfig = {
  settings: CulqiSettings;
  client: { email: string };
  options: Record<string, unknown>;
  appearance: Record<string, unknown>;
};

export type CulqiInstance = {
  open(): void;
  close(): void;
  /** Called by Culqi after it creates a token (card, Yape), an order code or an error. */
  culqi?: () => void;
  token?: CulqiToken | null;
  order?: unknown;
  error?: unknown;
};

type CulqiCheckoutConstructor = new (publicKey: string, config: CulqiConfig) => CulqiInstance;

declare global {
  interface Window {
    CulqiCheckout?: CulqiCheckoutConstructor;
  }
}

let loading: Promise<CulqiCheckoutConstructor> | null = null;

export function loadCulqiCheckout(): Promise<CulqiCheckoutConstructor> {
  if (window.CulqiCheckout) return Promise.resolve(window.CulqiCheckout);
  loading ??= new Promise<CulqiCheckoutConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.CulqiCheckout ? resolve(window.CulqiCheckout) : reject(new Error("Culqi not found")));
    script.onerror = () => {
      script.remove();
      reject(new Error("Culqi Checkout did not load"));
    };
    document.body.append(script);
  }).catch((error: unknown) => {
    loading = null; // let the next click try again
    throw error;
  });
  return loading;
}

/** Brand colors from the design tokens (app/globals.css): Culqi takes plain values. */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function createCulqiCheckout(
  CulqiCheckout: CulqiCheckoutConstructor,
  publicKey: string,
  settings: CulqiSettings,
  email: string,
): CulqiInstance {
  const primary = token("--color-brand-500");
  return new CulqiCheckout(publicKey, {
    settings,
    client: { email },
    options: {
      lang: "auto",
      installments: false,
      modal: true,
      paymentMethods: { tarjeta: true, yape: true, bancaMovil: true, agente: true, billetera: true, cuotealo: false },
    },
    appearance: {
      logo: `${window.location.origin}/brand/logo-symbol.svg`,
      defaultStyle: {
        bannerColor: token("--color-brand-900"),
        buttonBackground: primary,
        menuColor: primary,
        linksColor: primary,
        priceColor: primary,
      },
    },
  });
}
