import { test, expect, type Page } from "@playwright/test";

/**
 * Regression: bug #4 (HIGH) — the "CARD n" status text painted over the deck.
 *
 * statusTextTop was derived from the dome's theoretical geometry
 * (`min(lowest + 36, height - 30)`), but the cards render lower than the
 * constants predict, and the status block is z-30 over a z-10 deck. Measured
 * at 390x844: status occupied y 613-667 while the deck spanned y 257-660, a
 * 47px overlap with the text drawn on top of the card faces.
 *
 * Bug #12 was the same code: it mixed units (a calc() percentage when the deck
 * was empty, a px value otherwise) and was a useMemo over visibleCardIds, so
 * the ResizeObserver that recomputes `positions` on resize had no way to
 * recompute it and the offset went stale after a viewport change.
 */

async function openDeck(page: Page, step: 1 | 2 | 3 = 1) {
  await page.goto("/mini-app");
  await page.getByText("Love", { exact: false }).first().click();
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: "Begin Reading" }).click();
  for (let s = 1; s <= step; s++) {
    await page.waitForFunction((n) => document.body.innerText.includes(`CARD ${n}`), s, {
      timeout: 20_000,
    });
    await page.waitForTimeout(600);
    if (s < step) {
      await page.evaluate(() => {
        const arena = document.querySelector(".flex-1.relative.z-10");
        const nodes = Array.from(arena!.children[0].children).filter(
          (n) => n.getBoundingClientRect().width > 0
        );
        const boxes = nodes.map((n) => n.getBoundingClientRect());
        let best = boxes[0];
        boxes.forEach((b) => {
          if (Math.abs(b.left + b.width / 2 - window.innerWidth / 2) <
              Math.abs(best.left + best.width / 2 - window.innerWidth / 2)) best = b;
        });
        const ev = new MouseEvent("click", {
          bubbles: true,
          clientX: best.left + best.width / 2,
          clientY: best.top + best.height / 2,
        });
        nodes[boxes.indexOf(best)].dispatchEvent(ev);
      });
      await page.waitForTimeout(2800);
    }
  }
}

/** Union rect of the rendered deck cards, plus the status text rect. */
async function measure(page: Page) {
  return page.evaluate(() => {
    const arena = document.querySelector(".flex-1.relative.z-10");
    if (!arena) return null;
    const cards = Array.from(arena.children[0].children)
      .map((n) => n.getBoundingClientRect())
      .filter((r) => r.width > 0);

    const statusText = Array.from(document.querySelectorAll("p")).find((n) =>
      /^CARD \d ·/.test((n.textContent || "").trim())
    );
    const statusEl = statusText?.parentElement;
    const sr = statusEl ? statusEl.getBoundingClientRect() : null;

    return {
      deckTop: Math.round(Math.min(...cards.map((c) => c.top))),
      deckBottom: Math.round(Math.max(...cards.map((c) => c.bottom))),
      statusTop: sr ? Math.round(sr.top) : null,
      statusBottom: sr ? Math.round(sr.bottom) : null,
      arenaBottom: Math.round(arena.getBoundingClientRect().bottom),
      text: (statusText?.textContent || "").trim(),
    };
  });
}

for (const step of [1, 2, 3] as const) {
  test(`status text does not overlap the deck on card ${step}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openDeck(page, step);

    const m = await measure(page);
    expect(m, "deck or status text not found").not.toBeNull();
    expect(m!.statusTop, "status text missing").not.toBeNull();

    const overlaps = m!.statusBottom! > m!.deckTop && m!.statusTop! < m!.deckBottom;
    expect(
      overlaps,
      `status text (y ${m!.statusTop}-${m!.statusBottom}) overlaps deck (y ${m!.deckTop}-${m!.deckBottom})`
    ).toBe(false);
  });
}

/** The status text must stay inside the arena, not spill off-screen. */
test("status text stays within the drawing arena", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await openDeck(page);

  const m = await measure(page);
  expect(m!.statusBottom!).toBeLessThanOrEqual(m!.arenaBottom + 1);
});

/**
 * Bug #12: the offset was a useMemo over visibleCardIds only, so a viewport
 * change left it stale and the text drifted back over the deck.
 *
 * Portrait to portrait only. AGENTS.md states the Mini App is portrait
 * orientation only, so landscape is out of scope: at 844x390 the arena is
 * ~330px tall and a 208px deck leaves no room for a 54px status block under any
 * layout. Asserting a landscape fix would mean redesigning the deck for short
 * viewports, which is a separate piece of work rather than a regression here.
 */
test("status text does not overlap the deck after a portrait resize", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDeck(page);

  await page.setViewportSize({ width: 360, height: 780 });
  await page.waitForTimeout(1200);

  const m = await measure(page);
  const overlaps = m!.statusBottom! > m!.deckTop && m!.statusTop! < m!.deckBottom;
  expect(
    overlaps,
    `after resize: status (y ${m!.statusTop}-${m!.statusBottom}) overlaps deck (y ${m!.deckTop}-${m!.deckBottom})`
  ).toBe(false);
});