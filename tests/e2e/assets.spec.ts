import { test, expect } from "@playwright/test";

/**
 * Regression: bug #8 (MEDIUM) — every page requested five assets that 404.
 *
 * `public/` does not exist and never has: `git log --diff-filter=A -- 'public/*'`
 * is empty and `git rev-list --all --objects | grep ' public/'` returns nothing.
 * Yet app/layout.tsx declared four icon URLs under it and app/page.tsx rendered
 * an <img src="/cards/back.jpg">, so every page view issued four failing icon
 * requests and the homepage a fifth.
 *
 * The icons have no onError fallback. /cards/back.jpg does, which is why it was
 * invisible in the UI while still costing a request.
 */

const ROUTES = [
  "/",
  "/mini-app",
  "/readings",
  "/readings/love",
  "/readings/history",
  "/explorer",
  "/about",
];

for (const route of ROUTES) {
  test(`${route} loads without any failing asset request`, async ({ page }) => {
    const failures: string[] = [];
    page.on("response", (r) => {
      if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
    });

    await page.goto(route, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    expect(failures, `failing requests on ${route}`).toEqual([]);
  });
}

/** The favicon is fetched by the browser on its own, not via page markup. */
test("the site favicon resolves", async ({ page, request }) => {
  // app/icon.svg is picked up by Next automatically; this asserts it serves.
  const response = await request.get("/icon.svg");
  expect(response.status()).toBe(200);
});

/**
 * Icon coverage, added after docs/ICONS_AND_SEO.md was written.
 *
 * Only /icon.svg was emitted, so iOS "Add to Home Screen" fell back to a
 * screenshot of the page, and the bare /favicon.ico probe that some clients
 * and crawlers use returned 404.
 */
test("an apple-touch-icon is advertised for iOS home screens", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(500);

  const link = page.locator('link[rel="apple-touch-icon"]');
  await expect(link, "no <link rel=apple-touch-icon> emitted").toHaveCount(1);

  const href = await link.getAttribute("href");
  expect(href, "apple-touch-icon href missing").toBeTruthy();

  const response = await page.request.get(href!);
  expect(response.status(), `apple-touch-icon at ${href} should serve`).toBe(200);
});

test("apple-touch-icon is a PNG, since iOS ignores SVG for this", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(500);

  const href = await page
    .locator('link[rel="apple-touch-icon"]')
    .getAttribute("href");

  // Next appends a cache-busting query string ("/apple-icon.png?613325ef..."),
  // so assert on the pathname rather than the tail of the href.
  const pathname = new URL(href!, page.url()).pathname;
  expect(pathname.toLowerCase()).toMatch(/\.png$/);
});

test("the bare /favicon.ico probe resolves", async ({ request }) => {
  // Some clients and crawlers request this without reading the markup.
  const response = await request.get("/favicon.ico");
  expect(response.status()).toBe(200);
});

test("the dead app/apple-touch-icon.svg file is deleted", async () => {
  // Asserted on the filesystem, not over HTTP: the URL 404s both before and
  // after deletion, because Next never served it either way. The point is that
  // the inert file is gone from the repo, so it cannot be mistaken for the
  // real thing later.
  const { existsSync } = await import("node:fs");
  const path = await import("node:path");

  const stray = path.resolve(process.cwd(), "app/apple-touch-icon.svg");
  expect(
    existsSync(stray),
    "app/apple-touch-icon.svg should be deleted; Next's convention is apple-icon.*"
  ).toBe(false);

  // And the convention-correct file is the one that exists.
  expect(
    existsSync(path.resolve(process.cwd(), "app/apple-icon.png")),
    "app/apple-icon.png should exist"
  ).toBe(true);
});

test("the icon source of truth is still app/icon.svg", async ({ request }) => {
  // The raster icons are generated from this. Keeping it intact is what makes
  // them regenerable when real brand assets arrive.
  const response = await request.get("/icon.svg");
  expect(response.status()).toBe(200);
});

test("no console errors on the homepage", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  expect(errors, "console errors on /").toEqual([]);
});

/**
 * The homepage card previously layered an <img> over a gradient-and-SVG
 * fallback that it then hid via onError. Removing the broken img must leave
 * that fallback intact rather than an empty box.
 */
test("the homepage hero card still renders its fallback artwork", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(800);

  const card = page.locator("div.rounded-xl.aspect-\\[2\\/3\\]").first();
  await expect(card, "hero card missing").toBeVisible();

  // The crescent-moon SVG is drawn inline, over a gradient set on the inner
  // overlay div rather than on the card itself.
  await expect(card.locator("svg").first()).toBeVisible();

  const overlay = card.locator("div.absolute.inset-0").first();
  const background = await overlay.evaluate(
    (el) => getComputedStyle(el).backgroundImage
  );
  expect(background, "gradient fallback should remain").toContain("gradient");

  // No <img> left behind referencing the missing asset.
  await expect(card.locator("img")).toHaveCount(0);
});