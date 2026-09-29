import { defineConfig, devices } from "@playwright/test";

const PORT = 3211;
const MOCK_API_PORT = 3299;
const baseURL = `http://localhost:${PORT}`;

// Locally we use the installed Chrome (no browser download). In CI, run
// `npx playwright install chromium` and the bundled Chromium is used.
const channel = process.env.CI ? undefined : "chrome";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    locale: "es-PE",
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, channel } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel } },
  ],
  // Production build: closer to what users get, and it can run while `next dev`
  // is open (Next 16 allows a single dev server per project).
  // The app talks to a fake API (e2e/mock-api): Playwright cannot intercept the
  // server-side calls, and e2e must not hit the real backend or real people's data.
  webServer: [
    {
      command: "node e2e/mock-api/server.mjs",
      url: `http://localhost:${MOCK_API_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      env: { MOCK_API_PORT: String(MOCK_API_PORT), MOCK_API_TOKEN: "test-token" },
    },
    {
      command: `npm run build && npm run start -- --port ${PORT}`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        LAPOSITIVA_API_URL: `http://localhost:${MOCK_API_PORT}/api`,
        LAPOSITIVA_API_TOKEN: "test-token",
        SESSION_SECRET: "e2e-only-session-secret-0123456789abcdef",
        // Every test submits the home form from the same IP.
        RATE_LIMIT_START_PER_10_MIN: "10000",
      },
    },
  ],
});
