// Front-end types for the quote flow. Services map API responses into these.

export type Option<Id extends string | number = number> = { id: Id; name: string };

export type VehicleTypeOption = Option & { uses: Option[] };

/** Vehicle data as the front knows it. Any field can be missing after the plate lookup. */
export type VehicleData = {
  plate: string;
  typeId: number;
  useId: number;
  brand?: Option; // local brand id (GET /brands)
  model?: Option<string>; // La Positiva model id
  version?: Option<string>; // La Positiva version id
  year?: number;
  seats?: number;
  serial?: string;
  vin?: string;
};

export type Holder = {
  firstName?: string;
  lastName?: string;
  companyName?: string;
};

export type Plan = {
  id: number;
  name: string;
  priceCents: number;
  quoteToken: string | null;
  features: { name: string; included: boolean }[];
};

export type QuoteResult = {
  vehicle: VehicleData | null;
  holder: Holder | null;
  plans: Plan[];
  featuredPlanId: number | null;
};
