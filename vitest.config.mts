import { defineConfig } from "vitest/config";
import path from "node:path";
/**
 * Unit tests for the pure logic layer: reading composition, spread selection
 * and the geometry helpers. No DOM, so the default `node` environment is
 * correct and keeps the suite fast.
 *
 * The `@/` alias mirrors tsconfig.json (`"@/*": ["./*"]`). It is declared here
 * rather than pulled in from a plugin so the project gains no extra dependency.
 *
 * Component and layout regressions are covered by tests/e2e (Playwright)
 * instead — see playwright.config.ts.
 */
export default defineConfig({
  /*
   * tsconfig.json sets `"jsx": "preserve"` because Next.js compiles the JSX
   * itself. Vite's oxc transform honours that and then hands the still-JSX
   * source to its SSR pass, which fails to parse it. Overriding the runtime
   * here lets the component tests below be .tsx without duplicating a
   * tsconfig just for tests.
   */
  oxc: {
    jsx: { runtime: "automatic" },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  test: {
    environment: "node",
    // .tsx as well as .ts: component tests build elements (CardFront takes
    // props, so it has to be constructed rather than string-matched), and
    // these files are .tsx so the transformer parses them as JSX.
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    // Fail loudly on accidental `it.only` / `describe.skip` left in a commit.
    forbidOnly: !!process.env.CI,
  },
});
