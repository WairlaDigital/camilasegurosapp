// Fake app-soat-taxi API for e2e tests and local visual checks (no real lookups,
// no personal data, no quotes created). Mirrors the contract in docs/api.md.
//
//   node e2e/mock-api/server.mjs            → http://localhost:3299/api
//
// Example plates:
//   ABC-123  complete vehicle → quote ready
//   AEF-710  incomplete vehicle (HYUNDAI H1, no version/serial/VIN) → vehicle form
//   ZZZ-999  plate lookup fails (no vehicle); the backend then ignores manual data
//   ERR-500  upstream error (503)
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

function vehicleFor(body) {
  const manual = body.brand_id != null;
  switch (plate(body.plate)) {
    case "ABC123":
      return {
        plate: "ABC-123",
        year: 2018,
        seats: 5,
        serial: "SERIAL12345",
        vin: "VIN1234567890",
        brand: merged({ id: 1035, name: "HYUNDAI" }, { id: 5, name: "HYUNDAI" }),
        model: merged(null, { id: 1003272, name: "ACCENT" }),
        version: merged(null, { id: 10006180, name: "1.3" }),
      };
    case "AEF710":
      return manual
        ? { plate: "AEF-710", year: body.year, seats: body.seats, serial: body.serial, vin: body.vin, brand: merged(brands.find((b) => b.id === body.brand_id), null) }
        : {
            plate: "AEF-710",
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

const plans = {
  featured: 1,
  plans: [
    {
      id: 1,
      name: "SOAT--La Positiva--Automóvil",
      price: 210,
      quote_token: "tok-e2e",
      features: [
        { name: "Coberturas por ley", status: true },
        { name: "Cobertura a nivel nacional", status: true },
      ],
    },
  ],
};

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
      plans,
    };
    return send(res, 200, response);
  }

  send(res, 404, { message: `The route ${path} could not be found.` });
});

server.listen(PORT, () => console.log(`mock app-soat-taxi API on http://localhost:${PORT}/api`));
