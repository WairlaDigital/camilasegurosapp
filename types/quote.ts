// Front-end types for the quote flow. Services map API responses into these.

export type Option<Id extends string | number = number> = { id: Id; name: string };

/** Plate category (spec 4.1): motos, mototaxis and trimotos vs. autos, camionetas and camiones. */
export type VehicleCategory = "auto" | "moto";

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
  /** Category of the vehicle registration (plate lookup), when the API returns it. */
  registeredCategory?: VehicleCategory;
};

/** What the vehicle registration says (plate lookup, POST /query-plate). */
export type PlateRegistration = {
  category?: VehicleCategory;
  /** La Positiva vehicle class (IdClase), e.g. 10 = Motocicleta. */
  vehicleClass?: Option;
  seats?: number;
};

/** The document holder as the API returns it (RENIEC for DNI/CE, SUNAT for RUC). */
export type Holder = {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  /** Only with RUC: the backend does not keep a person's address. */
  address?: string;
  state?: string;
  district?: string;
};

export type Plan = {
  id: number;
  name: string;
  /** Display parts of `name` ("SOAT--La Positiva--Automóvil"): product and insurer. */
  product: string;
  insurer: string;
  priceCents: number;
  quoteToken: string | null;
  features: { name: string; included: boolean }[];
};

/** What the plan card needs: the quote token stays on the server. */
export type PlanSummary = Omit<Plan, "name" | "quoteToken">;

export type QuoteResult = {
  vehicle: VehicleData | null;
  holder: Holder | null;
  plans: Plan[];
  featuredPlanId: number | null;
};
