import { defineConfig } from "@playwright/test";

/**
 * Browser regressions: anything that depends on real layout, real hit-testing
 * or real sessionStorage. These are the defects that typecheck, lint and build
 * all pass straight through.
 *
 * Runs against a production build rather than `next dev` on purpose:
 * reactStrictMode is on, so dev double-invokes effects and would not reproduce
 * the timer behaviour these tests assert.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3210",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile",
      // Chromium, not the webkit that devices["iPhone 13"] defaults to: the
      // Mini App targets Android WebViews, and this is the only engine
      // installed in CI. 390x844 is the primary target width in AGENTS.md;
      // 360 and 412 are covered per-test via page.setViewportSize.
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npm run build && npm run start -- -p 3210",
    url: "http://localhost:3210",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
