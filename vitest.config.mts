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
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    // Fail loudly on accidental `it.only` / `describe.skip` left in a commit.
    forbidOnly: !!process.env.CI,
  },
});
