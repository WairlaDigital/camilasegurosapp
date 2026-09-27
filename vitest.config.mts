import { defineConfig } from "vitest/config";

// Unit tests for pure business rules (see node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md).
// Components and flows are covered by Playwright in e2e/.
export default defineConfig({
  resolve: { tsconfigPaths: true }, // `@/` aliases from tsconfig.json
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
  },
});
