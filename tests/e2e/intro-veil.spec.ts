import { test, expect } from "@playwright/test";

/**
 * Regression: bug #1 (CRITICAL).
 *
 * app/readings/IntroOverlay.tsx latched `showIntro` on mount and had no code
 * path that ever cleared it, while the sessionStorage flag it reads is only
 * written by the homepage IntroAnimation. So a visitor who reached any
 * /readings/* route without loading "/" first was covered by a permanent
 * fixed inset-0 z-50 veil and could not operate the page at all.
 *
 * The property under test is operability, not markup: a tap at the location of
 * a visible control must actually reach that control. Asserting on class names
 * or z-index is not the same thing — MiniAppDrawing's own root is legitimately
 * a fixed full-viewport container, because on these routes it *is* the page.
 */

/** First visible, in-viewport control that a visitor would reasonably tap. */
async function firstTappableControl(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("a[href], button")
    );
    for (const el of nodes) {
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      if (Number(cs.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) {
        continue;
      }
      const name = (el.textContent || "").trim() || el.getAttribute("aria-label") || "";
      return { x: cx, y: cy, name: name.slice(0, 40), tag: el.tagName };
    }
    return null;
  });
}

const READINGS_ROUTES = [
  "/readings",
  "/readings/love",
  "/readings/career",
  "/readings/general",
  "/readings/daily",
  "/readings/history",
];

for (const route of READINGS_ROUTES) {
  test(`${route} is operable on a cold session`, async ({ page }) => {
    await page.goto(route);

    // Give the intro veil its full lifetime to appear and clear itself.
    await page.waitForTimeout(1500);

    const control = await firstTappableControl(page);
    expect(control, `no tappable control found on ${route}`).not.toBeNull();

    // The topmost element at the control's own centre must be that control.
    // Before the fix this resolved to the veil instead.
    const hit = await page.evaluate(
      ({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        if (!el) return "<nothing>";
        return `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 70)}`;
      },
      control!
    );

    expect(
      hit,
      `tap at "${control!.name}" on ${route} hit ${hit} instead of the control`
    ).not.toMatch(/fixed inset-0 z-50/);
  });
}

/**
 * The full reading flow must be startable from a deep link, not merely
 * unpainted. This is the test that failed hardest before the fix: the button
 * was visible the whole time, so only a real click exposed the veil.
 */
test("a cold session can start a reading from a /readings deep link", async ({
  page,
}) => {
  await page.goto("/readings/love");

  const begin = page.getByRole("button", { name: "Begin Reading" });
  await expect(begin).toBeVisible();

  // Before the fix this timed out with "intercepts pointer events".
  await begin.click({ timeout: 5_000 });

  await expect(page.getByText("CARD 1", { exact: false })).toBeVisible({
    timeout: 10_000,
  });
});

/**
 * The veil is purely decorative, so it must never intercept a tap even while
 * it is on screen. Guards the pointer-events-none defence independently of
 * the bounded-lifetime fix.
 */
test("the intro veil never intercepts pointer events while visible", async ({
  page,
}) => {
  await page.goto("/readings/love");

  // Sample immediately: the veil is only up for the first ~900ms.
  const intercepts = await page.evaluate(() => {
    const veils = Array.from(document.querySelectorAll<HTMLElement>("div")).filter(
      (el) => {
        const cs = getComputedStyle(el);
        return (
          cs.position === "fixed" &&
          Number(cs.zIndex) >= 50 &&
          el.getBoundingClientRect().width > window.innerWidth * 0.9
        );
      }
    );
    return veils
      .filter((el) => getComputedStyle(el).pointerEvents !== "none")
      .map((el) => String(el.className).slice(0, 60));
  });

  expect(intercepts).toEqual([]);
});
