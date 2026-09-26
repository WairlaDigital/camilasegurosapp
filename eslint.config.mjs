import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Layer boundaries — see .claude/rules/architecture.md
const restrict = (patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
});

const ui = ["@/app/*", "@/features/*", "@/components/*"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["types/**"],
    rules: restrict([
      { group: [...ui, "@/services/*", "@/lib/*"], message: "types/ must not import anything." },
    ]),
  },
  {
    files: ["services/**"],
    rules: restrict([
      { group: ui, message: "services/ must not depend on the UI." },
    ]),
  },
  {
    files: ["app/**", "features/**", "components/**"],
    ignores: ["components/ui/**"],
    rules: restrict([
      { group: ["@/services/http", "@/services/schemas/*"], message: "Call the public service functions; never the HTTP client or raw API schemas." },
    ]),
  },
  {
    files: ["components/ui/**"],
    rules: restrict([
      { group: ["@/app/*", "@/features/*", "@/services/*", "@/types/*"], message: "UI primitives are data-agnostic." },
    ]),
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
