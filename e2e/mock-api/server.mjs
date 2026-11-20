// Fake app-soat-taxi API for e2e tests and local visual checks (no real lookups,
// no personal data, no quotes created). Mirrors the contract in docs/api.md.
//
//   node e2e/mock-api/server.mjs            → http://localhost:3299/api
//
// Example plates:
//   ABC-123  complete vehicle → quote ready
//   AEF-710  incomplete vehicle (HYUNDAI H1, no version/serial/VIN) → vehicle form
//   ZZZ-999  plate lookup fails (no vehicle); the backend then ignores manual data
//   AFO-123  complete vehicle, but only AFOCAT plans (not sold here) → no plan to show
//   MOT-123  auto-format plate registered as a moto (category L3) → mismatch message (spec 4.1)
//   CAM-777  complete camioneta (class 33, 5 seats) → quoted as "Camioneta hasta 7 asientos"
//   4321-AB  complete mototaxi (class 25) → quoted as Mototaxi, not the default Motocicleta
//   CAM-000  incomplete camioneta (class 33) without seats → the seats entered on step 2/3 pick "hasta 7" or "de 8"
//   PIK-123  complete pickup (class 16 → type 34) → can be quoted with Carga (auto + Carga has no default type)
//   5555-AB  complete motocicleta (class 10) → Taxi does not apply; with RUC nothing applies (spec 4.2)
//   MOD-503  incomplete vehicle with a brand but no model, and La Positiva's model list is down (503)
//   VIG-123  complete vehicle that already has a SOAT in force (La Positiva 20003) → active policy screen
//   ERR-500  upstream error (503)
// Plans: La Positiva at S/ 210 for today (Lima) and S/ 215 for any other start date
// (to test the re-quote), plus an AFOCAT plan that the front must hide. More than
// 200 days ahead the plan is another one (id 2, "SOAT DIGITAL", S/ 230); more than 300
// days ahead the quote takes 2 s (to see the quoting state).
//
// Checkout: POST /data creates the order (email @sin-dns.pe → 422 on driver.email);
// POST /charge succeeds unless the Culqi token id starts with "tkn_test_declined".
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_API_PORT ?? 3299);
const TOKEN = process.env.MOCK_API_TOKEN ?? "test-token";

const types = [
  { id: 1, order: 0, name: "Automóvil", uses: [{ id: 1, name: "Taxi" }, { id: 5, name: "Particular" }] },
  { id: 2, order: 1, name: "Mototaxi", uses: [{ id: 5, name: "Particular" }, { id: 1, name: "Taxi" }] },
  { id: 25, order: 3, name: "Camioneta hasta 7 asientos", uses: [{ id: 5, name: "Particular" }, { id: 1, name: "Taxi" }] },
  { id: 27, order: 4, name: "Camioneta de 8 asientos", uses: [{ id: 5, name: "Particular" }, { id: 1, name: "Taxi" }] },
  { id: 8, order: 5, name: "Minivan (9 a 16 asientos)", uses: [{ id: 5, name: "Particular" }] },
  { id: 10, order: 8, name: "Motocicleta", uses: [{ id: 5, name: "Particular" }] },
  { id: 16, order: 9, name: "Motocarga", uses: [{ id: 7, name: "Carga" }] },
  { id: 34, order: 13, name: "Cmta. Pick Up/Doble Cabina", uses: [{ id: 7, name: "Carga" }, { id: 5, name: "Particular" }] },
  { id: 5, order: 100, name: "Camioneta rural hasta 7 asientos", uses: [] },
];

const brands = [
  { id: 1035, name: "HYUNDAI" },
  { id: 1040, name: "HONDA" },
  { id: 2001, name: "TOYOTA" },
];

const models = {
  1035: [
    { id: "1003272", name: "ACCENT" },
    { id: "1003280", name: "H1" },
  ],
  2001: [{ id: "2000001", name: "YARIS" }],
};

const versions = {
  1003272: [
    { id: 10006180, name: "1.3" },
    { id: 10006181, name: "1.4" },
  ],
  1003280: [{ id: 10009000, name: "H1 2.5 CRDI" }],
  2000001: [{ id: 20000001, name: "1.5" }],
};

const merged = (local, positiva) => ({ ...(local ?? {}), positiva });
const plate = (value) => String(value ?? "").toUpperCase().replace(/-/g, "");

// What the vehicle registration says (La Positiva's plate lookup): MTC category
// (L* motos, M* cars) and vehicle class (IdClase). Used by /query-plate and /query-info.
const CAR = { id: 6, name: "M1" };
// `typeId` is the catalog type the backend matches to the class (by seats when a
// class has several types); /query-plate returns it as `type.id`.
const REGISTRY = {
  ABC123: { category: CAR, class: { id: 1, name: "AUTOMOVIL" }, typeId: 1, seats: 5 },
  AFO123: { category: CAR, class: { id: 1, name: "AUTOMOVIL" }, typeId: 1, seats: 5 },
  AEF710: { category: CAR, class: { id: 1, name: "AUTOMOVIL" }, typeId: 1, seats: null },
  MOD503: { category: CAR, class: { id: 1, name: "AUTOMOVIL" }, typeId: 1, seats: null },
  MOT123: { category: { id: 3, name: "L3" }, class: { id: 10, name: "MOTOCICLETA" }, typeId: 10, seats: 2 },
  CAM777: { category: CAR, class: { id: 33, name: "CAMIONETA" }, typeId: 25, seats: 5 },
  // Production shape (mototaxi 7845-IA): class without a name and no category.
  "4321AB": { category: { id: null, name: "-" }, class: { id: 25, name: null }, typeId: 2, seats: 3 },
  "5555AB": { category: { id: 3, name: "L3" }, class: { id: 10, name: "MOTOCICLETA" }, typeId: 10, seats: 2 },
  // Production shape (pickup BKD-931): class 16, the backend matches its own type 34.
  VIG123: { category: CAR, class: { id: 1, name: "AUTOMOVIL" }, typeId: 1, seats: 5 },
  PIK123: { category: { id: null, name: "-" }, class: { id: 16, name: null }, typeId: 34, seats: 3 },
  // Class 33 has two types by seats; without seats the backend picks the first by order.
  CAM000: {
    category: CAR,
    class: { id: 33, name: null },
    typeId: 25,
    seats: null,
    options: [
      { id: 25, name: "Camioneta hasta 7 asientos", min_seats: null, max_seats: 7 },
      { id: 27, name: "Camioneta de 8 asientos", min_seats: 8, max_seats: null },
    ],
  },
};
const COMPLETE = ["ABC123", "AFO123", "MOT123", "CAM777", "4321AB", "5555AB", "PIK123", "VIG123"];
// The backend merges our local type/category with the lookup's (positiva) values.
const categoryOf = (key) => merged(CAR, REGISTRY[key]?.category ?? CAR);
// The backend sends the matched local type (without its uses) and the class name
// falls back to the type's when La Positiva sends none.
function typeOf(registry) {
  const type = types.find((option) => option.id === registry.typeId);
  if (!type) return { positiva: registry.class };
  return {
    id: type.id,
    order: type.order,
    name: type.name,
    positiva: { id: registry.class.id, name: registry.class.name ?? type.name },
    ...(registry.options && { options: registry.options }),
  };
}

function vehicleFor(body) {
  const manual = body.brand_id != null;
  const key = plate(body.plate);
  if (COMPLETE.includes(key)) {
    return {
      plate: `${body.plate}`.toUpperCase(),
      category: categoryOf(key),
      year: 2018,
      seats: REGISTRY[key].seats,
      serial: "SERIAL12345",
      vin: "VIN1234567890",
      brand: merged({ id: 1035, name: "HYUNDAI" }, { id: 5, name: "HYUNDAI" }),
      model: merged(null, { id: 1003272, name: "ACCENT" }),
      version: merged(null, { id: 10006180, name: "1.3" }),
    };
  }
  switch (key) {
    case "AEF710":
      return manual
        ? { plate: "AEF-710", year: body.year, seats: body.seats, serial: body.serial, vin: body.vin, brand: merged(brands.find((b) => b.id === body.brand_id), null) }
        : {
            plate: "AEF-710",
            category: categoryOf("AEF710"),
            year: 2016,
            seats: null,
            serial: null,
            vin: null,
            brand: merged({ id: 1035, name: "HYUNDAI" }, { id: 5, name: "HYUNDAI" }),
            model: merged(null, { id: 1003280, name: "H1" }),
            version: null,
          };
    case "CAM000":
      return manual
        ? { plate: "CAM-000", year: body.year, seats: body.seats, serial: body.serial, vin: body.vin, brand: merged(brands.find((b) => b.id === body.brand_id), null) }
        : {
            plate: "CAM-000",
            category: categoryOf("CAM000"),
            year: 2016,
            seats: null,
            serial: null,
            vin: null,
            brand: merged({ id: 1035, name: "HYUNDAI" }, { id: 5, name: "HYUNDAI" }),
            model: merged(null, { id: 1003280, name: "H1" }),
            version: null,
          };
    case "MOD503":
      return {
        plate: "MOD-503",
        category: categoryOf("MOD503"),
        year: 2019,
        brand: merged({ id: 3001, name: "KIA" }, { id: 9, name: "KIA" }),
      };
    case "ZZZ999":
      return null; // lookup failed: the backend also drops manual data (PENDIENTES.md)
    default:
      return manual
        ? { plate: String(body.plate), year: body.year, seats: body.seats, serial: body.serial, vin: body.vin, brand: merged(brands.find((b) => b.id === body.brand_id), null) }
        : null;
  }
}

const todayInLima = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

const addDays = (isoDate, days) => {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const afocatPlan = {
  id: 89,
  name: "AFOCAT--Lider--Automóvil",
  price: 60,
  quote_token: null,
  features: [{ name: "Coberturas por ley", status: true }],
};

function plansFor(body) {
  if (plate(body.plate) === "AFO123") return { featured: 89, plans: [afocatPlan] };
  const startDate = body.start_date ?? todayInLima();
  const today = startDate === todayInLima();
  // More than 200 days ahead the dynamic plan changes (another id, name and coverages).
  if (startDate > addDays(todayInLima(), 200)) {
    return {
      featured: 2,
      plans: [
        {
          id: 2,
          name: "SOAT DIGITAL--La Positiva--Automóvil",
          price: 230,
          quote_token: `tok-e2e-${startDate}`,
          features: [{ name: "Coberturas por ley", status: true }],
        },
        afocatPlan,
      ],
    };
  }
  return {
    featured: 1,
    plans: [
      {
        id: 1,
        name: "SOAT--La Positiva--Automóvil",
        price: today ? 210 : 215,
        quote_token: `tok-e2e-${startDate}`,
        features: [
          { name: "Coberturas por ley", status: true },
          { name: "Cobertura a nivel nacional", status: true },
          { name: "Servicio de grúa*", status: true },
          { name: "Servicio de auxilio mecánico", status: true },
          { name: "100% digital", status: true },
        ],
      },
      afocatPlan,
    ],
  };
}

/** Orders created by POST /data (policy id → state). */
const orders = new Map();

const REQUIRED = ["document_type", "document_number", "plate", "type_id", "use_id", "ubigeo_id"];

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  if (url.pathname === "/health") return send(res, 200, { ok: true });
  if (req.headers.authorization !== `Bearer ${TOKEN}`) return send(res, 401, { message: "Unauthenticated." });

  const path = url.pathname.replace(/^\/api/, "");
  const search = (url.searchParams.get("search") ?? "").toLowerCase();
  const limit = Number(url.searchParams.get("limit") ?? 100);
  const filter = (list) => list.filter((item) => item.name.toLowerCase().includes(search)).slice(0, limit);

  if (req.method === "GET" && path === "/data") return send(res, 200, { types, groups: [] });
  if (req.method === "GET" && path === "/brands") return send(res, 200, { data: filter(brands) });

  const modelsMatch = path.match(/^\/models\/(\d+)\/type\/(\d+)$/);
  // KIA (MOD-503 only, never answered with a list so no cached response hides it): La Positiva is down.
  if (req.method === "GET" && modelsMatch?.[1] === "3001") return send(res, 503, { error: "La Positiva no responde" });
  if (req.method === "GET" && modelsMatch) return send(res, 200, { data: filter(models[modelsMatch[1]] ?? []) });

  const versionsMatch = path.match(/^\/versions\/(\d+)$/);
  if (req.method === "GET" && versionsMatch) return send(res, 200, { data: filter(versions[versionsMatch[1]] ?? []) });

  if (req.method === "POST" && path === "/query-plate") {
    const body = await readJson(req);
    // Like the backend's PlateValidation: /query-plate (unlike /query-info) needs the hyphen.
    if (!String(body.plate ?? "").includes("-")) {
      return send(res, 422, { message: "El formato de la placa no es válido.", errors: { plate: ["El formato de la placa no es válido."] } });
    }
    const key = plate(body.plate);
    if (key === "ERR500") return send(res, 503, { error: "La Positiva no responde" });
    const registry = REGISTRY[key];
    if (!registry) return send(res, 404, { error: "No se encontró información para la placa" });
    return send(res, 200, {
      data: {
        plate: String(body.plate).toUpperCase(),
        seats: registry.seats,
        category: { positiva: registry.category },
        type: typeOf(registry),
      },
    });
  }

  if (req.method === "POST" && path === "/query-info") {
    const body = await readJson(req);
    const missing = REQUIRED.filter((field) => body[field] == null || body[field] === "");
    if (missing.length > 0) {
      return send(res, 422, { message: "Invalid data.", errors: Object.fromEntries(missing.map((f) => [f, [`${f} is required`]])) });
    }
    if (plate(body.plate) === "ERR500") return send(res, 503, { error: "La Positiva no responde" });
    // La Positiva takes 5-10 s to quote: more than 300 days ahead, wait 2 s to show the quoting state.
    if (body.start_date && body.start_date > addDays(todayInLima(), 300)) await new Promise((r) => setTimeout(r, 2000));

    const vehicle = vehicleFor(body);
    // La Positiva refuses to quote a plate with a SOAT in force: no dynamic plan, and the
    // backend passes the expiry date it read from the message.
    const activePolicy = plate(body.plate) === "VIG123" && (!body.start_date || body.start_date <= "2027-10-05");
    if (vehicle && activePolicy) vehicle.active_policy = { expires_at: "2027-10-05" };
    const response = {
      // Like the backend: a person (DNI/CE) comes with names only; a company (RUC) with
      // its name and address but no first/last name.
      document:
        Number(body.document_type) === 2
          ? { company_name: "TRANSPORTES LIMA S.A.C.", address: "AV. JAVIER PRADO ESTE 123", state: "LIMA", district: "SAN ISIDRO" }
          : { names: "MARTÍN JAVIER", last_name: "RODRIGUEZ GONZALES", company_name: null },
      ...(vehicle && { vehicle }),
      plans: plansFor(body),
    };
    return send(res, 200, response);
  }

  if (req.method === "POST" && path === "/data") {
    const body = await readJson(req);
    // The backend reads these keys directly: a missing one is a PHP error (500).
    const keys = [
      [body, ["reseller", "order_id", "driver", "vehicle", "plan", "delivery"]],
      [body.driver ?? {}, ["id", "company_name"]],
      [body.vehicle ?? {}, ["color", "vin"]],
      [body.plan ?? {}, ["token"]],
    ];
    if (keys.some(([object, names]) => names.some((name) => !(name in object)))) {
      return send(res, 500, { message: "Undefined array key" });
    }
    const invalid = (field, message) => send(res, 422, { message, errors: { [field]: [message] } });
    if (!/^[A-Za-z\p{M}\p{L}\s]{2,}$/u.test(body.driver.first_name ?? "")) return invalid("driver.first_name", "first name");
    if (!/^9\d{8}$/.test(body.driver.phone ?? "")) return invalid("driver.phone", "phone");
    if (String(body.driver.email).endsWith("@sin-dns.pe")) return invalid("driver.email", "The driver.email must be a valid email address.");
    if (!/^[A-Za-z0-9]{5,}$/.test(body.vehicle.plate ?? "")) return invalid("vehicle.plate", "The vehicle.plate must only contain letters and numbers.");
    if (!/^[A-Za-z0-9]{8,}$/.test(body.vehicle.serial ?? "")) return invalid("vehicle.serial", "serial");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.delivery?.date ?? "")) return invalid("delivery.date", "date");

    // With order_id the backend reuses the policy and its Culqi order.
    const existing = body.order_id != null ? orders.get(body.order_id) : undefined;
    if (body.order_id != null && !existing) return invalid("order_id", "The selected order id is invalid.");
    const order = existing ?? { id: orders.size + 1001, paid: false };
    orders.set(order.id, order);
    // The price comes from the saved quote (its token), not from the request.
    const price = body.plan.token === `tok-e2e-${todayInLima()}` ? 210 : 215;
    return send(res, 200, {
      culqi: { amount: price * 100, title: "SOAT--La Positiva--Automóvil", currency: "PEN", order: `ord_test_e2e${order.id}` },
      order_id: order.id,
    });
  }

  if (req.method === "POST" && path === "/charge") {
    const body = await readJson(req);
    const id = String(body.token?.id ?? "");
    if (id.length < 15 || id.length > 30) return send(res, 422, { message: "token", errors: { "token.id": ["token"] } });
    const order = orders.get(body.order);
    if (!order) return send(res, 422, { message: "order", errors: { order: ["The selected order is invalid."] } });
    if (id.startsWith("tkn_test_declined")) {
      return send(res, 200, { status: "error", data: { user_message: "Tu tarjeta ha sido rechazada." } });
    }
    order.paid = true;
    return send(res, 200, { status: "success" });
  }

  send(res, 404, { message: `The route ${path} could not be found.` });
});

server.listen(PORT, () => console.log(`mock app-soat-taxi API on http://localhost:${PORT}/api`));
