import { test, expect } from "@playwright/test";

/**
 * Regressions: bug #5 (HIGH) — the homepage overflowed horizontally at every
 * mobile width.
 *
 * PhoneFrame's ambient glow is `position: absolute; inset: -40px` inside a
 * `relative` wrapper with no clip, so it bled 40px past each side of the
 * device and widened the document by 24px at 320/360/375/390/412. That broke
 * the AGENTS.md checklist item "No horizontal scrolling on 360px screens".
 *
 * The device body's bezel is a non-inset box-shadow, which an ancestor's
 * overflow would also clip — so the fix has to clip the glow alone. The
 * second test below is the guard against "fixing" it by clipping the frame.
 */

const MOBILE_WIDTHS = [320, 360, 375, 390, 412];

for (const width of MOBILE_WIDTHS) {
  test(`the homepage does not scroll horizontally at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.waitForTimeout(600);

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(
      scrollWidth,
      `horizontal overflow of ${scrollWidth - clientWidth}px at ${width}px`
    ).toBeLessThanOrEqual(clientWidth);
  });
}

/** The fix must clip the glow, not the device frame. */
test("the phone preview keeps its glow and its bezel ring", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForTimeout(600);

  const result = await page.evaluate(() => {
    const glow = document.querySelector(".blur-2xl");
    // The device body: rounded-[3rem] with a box-shadow bezel ring.
    const bodies = Array.from(
      document.querySelectorAll<HTMLElement>("div.rounded-\\[3rem\\]")
    );
    return {
      glowPresent: !!glow,
      glowBlurred: glow ? getComputedStyle(glow).filter.includes("blur") : false,
      bodyCount: bodies.length,
      hasBezelShadow: bodies.some((b) => {
        const s = getComputedStyle(b).boxShadow;
        return s !== "none" && s.includes("rgb");
      }),
    };
  });

  expect(result.glowPresent, "ambient glow was removed instead of clipped").toBe(true);
  expect(result.glowBlurred).toBe(true);
  expect(result.bodyCount, "device body missing").toBeGreaterThan(0);
  expect(result.hasBezelShadow, "bezel ring was clipped away").toBe(true);
});

/** Control: the rest of the site was already clean and must stay clean. */
const CLEAN_ROUTES = ["/mini-app", "/readings", "/readings/love", "/explorer", "/about", "/readings/history"];

for (const width of [320, 360, 390, 412]) {
  test(`no route scrolls horizontally at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });

    for (const route of CLEAN_ROUTES) {
      await page.goto(route);
      await page.waitForTimeout(400);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(
        scrollWidth,
        `${route} overflows by ${scrollWidth - clientWidth}px at ${width}px`
      ).toBeLessThanOrEqual(clientWidth);
    }
  });
}
