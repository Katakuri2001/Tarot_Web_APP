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