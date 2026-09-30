// Front-end types for the order and the payment. Services map API responses into these.

/** Settings Culqi Checkout opens with (`settings` of `new CulqiCheckout`). */
export type CulqiSettings = {
  title: string;
  currency: "PEN" | "USD";
  /** Integer cents, taken by the API from the saved quote. */
  amount: number;
  /** Culqi order id: enables the deferred methods (banca móvil, agentes, billeteras). */
  order: string;
};

/** The pending policy created by POST /data and its Culqi order. */
export type PaymentOrder = {
  orderId: number;
  culqi: CulqiSettings;
};

/** What POST /data needs, as the front knows it. */
export type CreateOrderInput = {
  /** Order to reuse (retries): the API then keeps the same policy and Culqi order. */
  orderId?: number;
  driver: {
    documentTypeId: number;
    documentNumber: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    address: string;
    state: string;
    district: string;
    phone: string;
    email: string;
  };
  vehicle: {
    plate: string;
    typeId: number;
    useId: number;
    ubigeoId: string;
    brandId: number;
    modelId: string;
    versionId: string;
    year: number;
    seats: number;
    serial: string;
    vin?: string;
  };
  plan: { id: number; priceCents: number; quoteToken: string | null };
  startDate: string; // YYYY-MM-DD
};

export type ChargeResult = { ok: true } | { ok: false };
