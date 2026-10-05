import { test, expect, type Page } from "@playwright/test";

/**
 * Pins where each legacy reading-type deep link lands.
 *
 * Bug #10 (MEDIUM): app/readings/daily/page.tsx was a static page rendering
 * <MiniAppDrawing /> with no initialCategory. A static segment takes
 * precedence over the dynamic sibling, so /readings/daily bypassed
 * TYPE_TO_CATEGORY entirely and that map's `daily` entry was unreachable dead
 * code. The page has been removed so [type] handles every segment.
 *
 * That fix has no observable behaviour change by design — the redundant page
 * already opened the picker — so unlike the other regressions here there is no
 * failing-before state to demonstrate. This is a characterisation test: it
 * pins the landing behaviour of every linked reading route so the segments
 * cannot quietly diverge again, and it fails loudly if someone reintroduces a
 * static page that shadows the shared mapping.
 */

const PICKER_HEADING = "What would you like to know?";

async function landing(page: Page, route: string) {
  await page.goto(route);
  await page.waitForTimeout(900);
  const body = await page.locator("body").innerText();
  // The intro screen uses h2; the picker uses h1 and has no h2 at all. A bare
  // textContent() waits the full actionability timeout for a missing element,
  // so the timeout is explicit and failure is expected.
  const h2 = await page
    .locator("h2")
    .first()
    .textContent({ timeout: 1_000 })
    .catch(() => null);
  return {
    onPicker: body.includes(PICKER_HEADING),
    heading: h2?.trim() ?? null,
    hasBegin: body.includes("Begin Reading"),
  };
}

test("/readings/love pre-selects the Love category", async ({ page }) => {
  const r = await landing(page, "/readings/love");
  expect(r.onPicker).toBe(false);
  expect(r.heading).toBe("Love");
  expect(r.hasBegin).toBe(true);
});

test("/readings/career pre-selects the Business category", async ({ page }) => {
  const r = await landing(page, "/readings/career");
  expect(r.onPicker).toBe(false);
  expect(r.heading).toBe("Business");
});

/** No category equivalent, so these open on the picker. */
for (const route of ["/readings/daily", "/readings/general"]) {
  test(`${route} opens the category picker`, async ({ page }) => {
    const r = await landing(page, route);
    expect(r.onPicker, `${route} should open the picker`).toBe(true);
  });
}

/** The mapping lives in one place; every segment must go through it. */
test("every legacy reading route lands consistently", async ({ page }) => {
  const love = await landing(page, "/readings/love");
  const career = await landing(page, "/readings/career");
  const daily = await landing(page, "/readings/daily");
  const general = await landing(page, "/readings/general");

  // Mapped types share the intro screen with their category pre-selected.
  expect(love.onPicker).toBe(career.onPicker);
  expect(love.hasBegin).toBe(career.hasBegin);

  // Unmapped types share the picker, and are distinct from the mapped ones.
  expect(daily.onPicker).toBe(true);
  expect(general.onPicker).toBe(true);
  expect(love.onPicker).toBe(false);
});

/** Unknown types must still 404 rather than silently falling back. */
test("an unknown reading type still returns a real 404", async ({ page }) => {
  const response = await page.goto("/readings/nonsense");
  expect(response?.status()).toBe(404);
});

/**
 * The homepage and /readings both link to /readings/daily, so removing the
 * static page must not have turned that into a 404.
 */
test("/readings/daily is still reachable from the linked entry points", async ({
  page,
}) => {
  for (const from of ["/", "/readings"]) {
    await page.goto(from);
    await page.waitForTimeout(600);
    const link = page.getByRole("link", { name: /Daily Reading/i }).first();
    await expect(link, `Daily Reading link missing on ${from}`).toBeVisible();
    await link.click();
    await page.waitForTimeout(900);
    expect(new URL(page.url()).pathname).toBe("/readings/daily");
    expect(
      (await page.locator("body").innerText()).includes(PICKER_HEADING),
      "linked /readings/daily should reach the picker, not a 404"
    ).toBe(true);

    await page.goto("/readings");
    await page.waitForTimeout(400);
  }
});