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
//   5555-AB  complete motocicleta (class 10) → Taxi does not apply; with RUC nothing applies (spec 4.2)
//   ERR-500  upstream error (503)
// Plans: La Positiva at S/ 210 for today (Lima) and S/ 215 for any other start date
// (to test the re-quote), plus an AFOCAT plan that the front must hide.
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_API_PORT ?? 3299);
const TOKEN = process.env.MOCK_API_TOKEN ?? "test-token";

const types = [
  { id: 1, order: 0, name: "Automóvil", uses: [{ id: 1, name: "Taxi" }, { id: 5, name: "Particular" }] },
  { id: 2, order: 1, name: "Mototaxi", uses: [{ id: 5, name: "Particular" }, { id: 1, name: "Taxi" }] },
  { id: 25, order: 3, name: "Camioneta hasta 7 asientos", uses: [{ id: 5, name: "Particular" }, { id: 1, name: "Taxi" }] },
  { id: 8, order: 5, name: "Minivan (9 a 16 asientos)", uses: [{ id: 5, name: "Particular" }] },
  { id: 10, order: 8, name: "Motocicleta", uses: [{ id: 5, name: "Particular" }] },
  { id: 16, order: 9, name: "Motocarga", uses: [{ id: 7, name: "Carga" }] },
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
const REGISTRY = {
  ABC123: { category: CAR, class: { id: 1, name: "AUTOMOVIL" }, seats: 5 },
  AFO123: { category: CAR, class: { id: 1, name: "AUTOMOVIL" }, seats: 5 },
  AEF710: { category: CAR, class: { id: 1, name: "AUTOMOVIL" }, seats: null },
  MOT123: { category: { id: 3, name: "L3" }, class: { id: 10, name: "MOTOCICLETA" }, seats: 2 },
  CAM777: { category: CAR, class: { id: 33, name: "CAMIONETA" }, seats: 5 },
  "4321AB": { category: { id: 5, name: "L5" }, class: { id: 25, name: "MOTOTAXI" }, seats: 3 },
  "5555AB": { category: { id: 3, name: "L3" }, class: { id: 10, name: "MOTOCICLETA" }, seats: 2 },
};
const COMPLETE = ["ABC123", "AFO123", "MOT123", "CAM777", "4321AB", "5555AB"];
// The backend merges our local type/category with the lookup's (positiva) values.
const categoryOf = (key) => merged(CAR, REGISTRY[key]?.category ?? CAR);

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
  if (req.method === "GET" && modelsMatch) return send(res, 200, { data: filter(models[modelsMatch[1]] ?? []) });

  const versionsMatch = path.match(/^\/versions\/(\d+)$/);
  if (req.method === "GET" && versionsMatch) return send(res, 200, { data: filter(versions[versionsMatch[1]] ?? []) });

  if (req.method === "POST" && path === "/query-plate") {
    const body = await readJson(req);
    const key = plate(body.plate);
    if (key === "ERR500") return send(res, 503, { error: "La Positiva no responde" });
    const registry = REGISTRY[key];
    if (!registry) return send(res, 404, { error: "No se encontró información para la placa" });
    return send(res, 200, {
      data: {
        plate: String(body.plate).toUpperCase(),
        seats: registry.seats,
        category: { positiva: registry.category },
        type: { positiva: registry.class },
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

    const vehicle = vehicleFor(body);
    const response = {
      document: { names: "MARTÍN JAVIER", last_name: "RODRIGUEZ GONZALES", company_name: null },
      ...(vehicle && { vehicle }),
      plans: plansFor(body),
    };
    return send(res, 200, response);
  }

  send(res, 404, { message: `The route ${path} could not be found.` });
});

server.listen(PORT, () => console.log(`mock app-soat-taxi API on http://localhost:${PORT}/api`));
