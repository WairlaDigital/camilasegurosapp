import { defineConfig, devices } from "@playwright/test";

const PORT = 3211;
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
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
