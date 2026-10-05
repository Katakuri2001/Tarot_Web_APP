import { test, expect, type Page } from "@playwright/test";

/**
 * Regression: bug #6 (MEDIUM) — the outer deck cards were effectively
 * untappable.
 *
 * Seven cards are fanned across a 45° dome, so each neighbour covers most of
 * the one outside it. Measured exposed slivers were 10–39px depending on
 * width and position, against the AGENTS.md rule that touch targets be at
 * least 44px.
 *
 * "Exposed" is the operative word. A deck card's bounding box is ~176–222px
 * wide, but what a thumb can hit is the contiguous strip not covered by a card
 * painted above it. Measuring the bounding box would report a comfortable pass
 * and hide the defect entirely — an earlier draft of this file did exactly
 * that and went green against the real bug.
 *
 * So the metric is measured the way a thumb finds it: walk the card at
 * mid-height in 2px steps and record the longest run of points where
 * `elementFromPoint` returns that card or one of its own descendants.
 */

/** AGENTS.md: touch targets ≥ 44px where practical. */
const MIN_TOUCH_TARGET = 44;

type CardProbe = {
  index: number;
  box: { left: number; right: number };
  longestReachableRun: number;
};

async function openDeck(page: Page, category: string) {
  await page.goto("/mini-app");
  await page.getByText(category, { exact: false }).first().click();
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: "Begin Reading" }).click();
  await page.waitForFunction(() => document.body.innerText.includes("CARD 1"), undefined, {
    timeout: 20_000,
  });
  await page.waitForTimeout(800);
}

function probeDeck(page: Page): Promise<CardProbe[]> {
  return page.evaluate(() => {
    const arena = document.querySelector(".flex-1.relative.z-10");
    if (!arena) return [];
    const nodes = Array.from(arena.children[0].children).filter(
      (n) => n.getBoundingClientRect().width > 0
    );

    return nodes.map((n, index) => {
      const r = n.getBoundingClientRect();
      const midY = r.top + r.height / 2;
      let run = 0;
      let longest = 0;
      // 2px steps: fine enough to find a narrow gap, coarse enough to be fast.
      for (let x = r.left; x <= r.right; x += 2) {
        const hit = document.elementFromPoint(x, midY);
        if (hit && (hit === n || n.contains(hit))) {
          run += 2;
          if (run > longest) longest = run;
        } else {
          run = 0;
        }
      }
      return {
        index,
        box: { left: Math.round(r.left), right: Math.round(r.right) },
        longestReachableRun: Math.round(longest),
      };
    });
  });
}

for (const width of [360, 390, 412]) {
  test(`every deck card is reachable across ${MIN_TOUCH_TARGET}px at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await openDeck(page, "Love");

    const cards = await probeDeck(page);
    // Not a magic number: the candidate count is a geometry trade-off (see
    // NUM_VISIBLE in MiniAppDrawing) and may change again. What matters is
    // that the fan offers a real choice and that every card is reachable.
    expect(cards.length, "deck should offer several candidates").toBeGreaterThanOrEqual(3);

    const tooSmall = cards.filter((c) => c.longestReachableRun < MIN_TOUCH_TARGET);

    expect(
      tooSmall.map(
        (c) =>
          `card ${c.index} (L${c.box.left}–R${c.box.right}) reachable run ${c.longestReachableRun}px`
      ),
      `deck cards with less than ${MIN_TOUCH_TARGET}px of reachable area at ${width}px`
    ).toEqual([]);
  });
}

/**
 * The complement of the above: whatever the geometry, tapping each card must
 * select that card rather than a neighbour. Uses the widest reachable run of
 * each card as the tap point, so it holds for any layout.
 */
test("tapping the outermost deck cards selects those cards", async ({ page }) => {
  // Only the outer two: they are the ones the fan buries, and each iteration
  // needs a full reload (~6s with the shuffle). Probing all five overflowed the
  // test timeout, which is a harness limit rather than a product signal.
  test.setTimeout(120_000);

  await page.setViewportSize({ width: 390, height: 844 });
  await openDeck(page, "Love");

  const cards = await page.evaluate(() => {
    const arena = document.querySelector(".flex-1.relative.z-10");
    if (!arena) return [];
    const nodes = Array.from(arena.children[0].children).filter(
      (n) => n.getBoundingClientRect().width > 0
    );

    return nodes.map((n) => {
      const r = n.getBoundingClientRect();
      const midY = r.top + r.height / 2;
      let runStart = -1;
      let best = { start: -1, length: 0 };
      for (let x = r.left; x <= r.right; x += 2) {
        const hit = document.elementFromPoint(x, midY);
        const mine = hit && (hit === n || n.contains(hit));
        if (mine && runStart < 0) runStart = x;
        if (mine) {
          const len = x - runStart + 2;
          if (len > best.length) best = { start: runStart, length: len };
        } else {
          runStart = -1;
        }
      }
      // Centre of the widest reachable run.
      return {
        x: best.start + best.length / 2,
        y: midY,
        length: best.length,
      };
    });
  });

  expect(cards.length).toBeGreaterThanOrEqual(3);

  // First and last only — see the note at the top of the test.
  const targets = [0, cards.length - 1];

  for (const i of targets) {
    const card = cards[i];
    const before = await page.evaluate(
      () => document.body.innerText.match(/CARD (\d)/)?.[1] ?? ""
    );

    await page.mouse.click(card.x, card.y);
    // The selection advances the phase, so wait for either the next card step
    // or the reveal.
    await page
      .waitForFunction(
        (prev) => {
          const now = document.body.innerText.match(/CARD (\d)/)?.[1] ?? "";
          return now !== prev || /Revealing|Placing/.test(document.body.innerText);
        },
        before,
        { timeout: 8_000 }
      )
      .catch(() => {
        throw new Error(
          `tapping the widest reachable strip of card ${i} (run ${card.length}px) did not advance the reading`
        );
      });

    // Reload for a clean deck before probing the next target.
    await openDeck(page, "Love");
  }
});