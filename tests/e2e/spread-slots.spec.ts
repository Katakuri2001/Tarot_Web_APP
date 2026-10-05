import { test, expect, type Page } from "@playwright/test";

/**
 * Regression: bug #9 (MEDIUM) — the spread slot captions wrapped unevenly.
 *
 * MiniAppDrawing rendered `positionMeta.label.split(" /")[0]` inside the 64px
 * slot row. That yields "Current Energy", which wraps to two lines, while
 * "Influence" and "Guidance" fit on one, so the three captions ended up on
 * different baselines and the row looked misaligned.
 */

async function openDeck(page: Page) {
  await page.goto("/mini-app");
  await page.getByText("Love", { exact: false }).first().click();
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: "Begin Reading" }).click();
  await page.waitForFunction(() => document.body.innerText.includes("CARD 1"), undefined, {
    timeout: 20_000,
  });
  await page.waitForTimeout(700);
}

/** The three captions under the placeholder slots, with their geometry. */
async function captions(page: Page) {
  return page.evaluate(() => {
    const arena = document.querySelector(".flex-1.relative.z-10");
    if (!arena) return null;
    // The slot row is the flex container of three fixed-width placeholders.
    const slots = Array.from(arena.querySelectorAll("div")).filter(
      (n) => getComputedStyle(n).aspectRatio !== "auto" && n.style.width
    );
    const out: { text: string; height: number; top: number; lines: number }[] = [];
    for (const slot of slots) {
      const caption = slot.nextElementSibling;
      if (!caption) continue;
      const r = caption.getBoundingClientRect();
      const cs = getComputedStyle(caption);
      out.push({
        text: (caption.textContent || "").trim(),
        height: Math.round(r.height),
        top: Math.round(r.top),
        // lineCount is not universally supported; infer from height/line-height.
        lines: Math.round(r.height / parseFloat(cs.lineHeight || "12")),
      });
    }
    return out;
  });
}

test("all three spread slot captions are a single line", async ({ page }) => {
  await openDeck(page);

  const caps = await captions(page);
  expect(caps, "slot captions not found").not.toBeNull();
  expect(caps!.length, "expected 3 captions").toBe(3);

  const wrapped = caps!.filter((c) => c.lines > 1);
  expect(
    wrapped.map((c) => `"${c.text}" wrapped to ${c.lines} lines`),
    "slot captions must not wrap"
  ).toEqual([]);
});

test("all three spread slot captions share a baseline", async ({ page }) => {
  await openDeck(page);

  const caps = await captions(page);
  const tops = caps!.map((c) => c.top);

  // Ragged baselines are what made the row look broken.
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(2);
});

/** The captions must still identify the position, not become unreadable. */
test("slot captions stay meaningful", async ({ page }) => {
  await openDeck(page);

  const caps = await captions(page);
  const texts = caps!.map((c) => c.text.toLowerCase());

  expect(texts.some((t) => t.includes("current"))).toBe(true);
  expect(texts.some((t) => t.includes("influence"))).toBe(true);
  expect(texts.some((t) => t.includes("guidance"))).toBe(true);
});