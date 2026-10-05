import { test, expect } from "@playwright/test";

/**
 * Regression: bug #2 (CRITICAL).
 *
 * app/readings/layout.tsx and app/readings/[type]/layout.tsx both rendered
 * <NavBar />, so every route under /readings/[type] shipped two navigation
 * landmarks and two copies of every nav link. Counted by accessible role and
 * name, which is how a screen reader perceives it.
 */

test("/readings/love renders exactly one navigation landmark", async ({ page }) => {
  await page.goto("/readings/love");
  await expect(
    page.getByRole("navigation", { name: "Main navigation" })
  ).toHaveCount(1);
});

test("the nav link labels appear once, not twice", async ({ page }) => {
  await page.goto("/readings/love");

  // Before the fix each of these resolved to 2 elements.
  for (const label of ["Home", "Readings", "Tarot", "My Readings", "About"]) {
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: label, exact: true }),
      `duplicate "${label}" link in the nav landmark`
    ).toHaveCount(1);
  }
});

/**
 * app/readings/layout.tsx is the single provider for the whole subtree, so
 * no page or nested layout beneath it may render navigation again. Before the
 * fix the saved-reading detail route stacked three copies.
 */
test("no page under /readings adds a second navigation landmark", async ({
  page,
}) => {
  const routes = [
    "/readings",
    "/readings/love",
    "/readings/career",
    "/readings/general",
    "/readings/daily",
    "/readings/history",
    // Saved-reading detail: layout + [type]/layout + ReadingDetail = 3 before.
    "/readings/general/some-id",
    // notFound() paths still render a layout above the boundary.
    "/readings/bogus",
    "/readings/love/missing",
  ];

  for (const route of routes) {
    await page.goto(route);
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }),
      `navigation count on ${route}`
    ).toHaveCount(1);
  }
});

/** The duplicated layout only affects the /readings subtree. */
test("routes outside /readings still render one navigation", async ({ page }) => {
  for (const route of ["/", "/about", "/explorer"]) {
    await page.goto(route);
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }),
      `navigation count on ${route}`
    ).toHaveCount(1);
  }
});
