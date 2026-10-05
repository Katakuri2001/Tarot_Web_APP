import { test, expect, type Page } from "@playwright/test";

/**
 * Regression: bug #11 (MEDIUM) — the saved-reading detail page contradicted the
 * Mini App result.
 *
 * MiniAppDrawing saved every category reading with a hardcoded
 * readingType: "general". ReadingDetail then headed the page
 * getReadingTypeLabel("general") — "GENERAL" for a Health or Wealth reading —
 * and called getCardInterpretation(..., "general"), so a Love reading that had
 * just shown loveUpright on the result screen reverted to generalUpright on its
 * own detail page.
 *
 * Covers a reading saved by the current code (with categoryId) and one shaped
 * like a pre-fix reading (label only), since those have to resolve too.
 */

const SAVED_WITH_ID = {
  id: "test-with-id",
  readingType: "general",
  category: "Love",
  categoryId: "love",
  question: "",
  cards: [
    { position: "Current Energy", positionId: "current-energy", cardName: "Strength", cardId: "strength", orientation: "upright" },
    { position: "Influence / Challenge", positionId: "influence-challenge", cardName: "The Hanged Man", cardId: "the-hanged-man", orientation: "reversed" },
    { position: "Guidance / Direction", positionId: "guidance-direction", cardName: "The Fool", cardId: "the-fool", orientation: "upright" },
  ],
  timestamp: 1767225600000,
};

/** A reading persisted before categoryId existed. */
const SAVED_LEGACY = {
  ...SAVED_WITH_ID,
  id: "test-legacy",
  categoryId: undefined,
};

/**
 * Expected love-category meanings, straight from the card data.
 *
 * These are the `love*` fields on purpose: the bug was that a Love reading
 * showed `general*` text here. The generic meaning of The Fool is a completely
 * different sentence ("Embrace the unknown with open arms..."), so asserting
 * the love text cannot pass on a generic fallback.
 */
const LOVE_MEANINGS = {
  strength: "Love through gentle strength and patience. Tenderness conquers all.",
  "the-hanged-man": "Resisting necessary change in love or unproductive sacrifice.",
  "the-fool": "A fresh start in love. Be open to new connections and trust the journey ahead.",
};

/** The generic meanings that must NOT appear for a Love reading. */
const GENERIC_MEANINGS = {
  strength: "True strength is quiet and patient. Let your actions speak with power.",
  "the-hanged-man": "Resisting necessary pauses or making needless sacrifices. Find freedom.",
  "the-fool": "Embrace the unknown with open arms. Life is about to surprise you in wonderful ways.",
};

async function seed(page: Page, reading: Record<string, unknown>) {
  await page.goto("/readings/history");
  await page.evaluate((r: Record<string, unknown>) => {
    localStorage.setItem("velora_readings", JSON.stringify([r]));
  }, reading);
}

for (const [name, reading] of [
  ["a current reading", SAVED_WITH_ID],
  ["a legacy reading without categoryId", SAVED_LEGACY],
] as const) {
  test(`${name} shows its category, not "General"`, async ({ page }) => {
    await seed(page, reading as unknown as Record<string, unknown>);
    await page.goto(`/readings/general/${(reading as { id: string }).id}`);

    // Reveal the summary: cards reveal one at a time on a timer.
    await page.waitForTimeout(5200);

    const body = await page.locator("body").innerText();

    // The heading is rendered uppercase by CSS, so innerText reports it that
    // way. Assert on the heading specifically: a loose /Love/i match passes on
    // the summary sentence "Your love reading reveals...", which was true
    // before the fix too.
    expect(body, "heading should be the category").toMatch(/^\s*LOVE\s*$/m);
    expect(body, "must not be headed with the readingType label").not.toContain(
      "General Reading"
    );
  });

  test(`${name} uses category meanings for its cards`, async ({ page }) => {
    await seed(page, reading as unknown as Record<string, unknown>);
    await page.goto(`/readings/general/${(reading as { id: string }).id}`);
    await page.waitForTimeout(5200);

    const body = await page.locator("body").innerText();

    for (const [cardId, meaning] of Object.entries(LOVE_MEANINGS)) {
      expect(body, `${cardId} should use its love meaning`).toContain(meaning);
    }

    // And explicitly not the generic meaning it used to fall back to.
    for (const [cardId, meaning] of Object.entries(GENERIC_MEANINGS)) {
      expect(body, `${cardId} must not show its generic meaning`).not.toContain(meaning);
    }

    // Positive proof the category path ran: only
    // getCategoryCardReading prefixes a position lead-in.
    expect(body, "category lead-in should be present").toContain(
      "In your love life right now"
    );
  });
}

/** An unresolvable category must fall back rather than render blank text. */
test("an unknown category still renders a card interpretation", async ({ page }) => {
  await seed(page, {
    ...SAVED_WITH_ID,
    id: "test-unknown",
    category: "Vibes",
    categoryId: "not-a-category",
  });
  await page.goto("/readings/general/test-unknown");
  await page.waitForTimeout(5200);

  const body = await page.locator("body").innerText();
  // Falls back to the readingType-based meaning, so text is present.
  expect(body).toMatch(/Reading Summary/i);
  expect(body.length).toBeGreaterThan(200);
});

/** The detail page must still report a missing reading rather than crash. */
test("an unknown reading id reports not found", async ({ page }) => {
  await seed(page, SAVED_WITH_ID as unknown as Record<string, unknown>);
  await page.goto("/readings/general/does-not-exist");

  await expect(page.getByText(/Reading not found/i)).toBeVisible();
});