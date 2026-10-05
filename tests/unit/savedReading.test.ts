import { describe, it, expect } from "vitest";
import { getCardById } from "@/utils/tarotUtils";
import {
  TAROT_CATEGORIES,
  TAROT_POSITIONS,
  isTarotCategory,
  isTarotPosition,
  getPositionIdFromLabel,
  resolveReadingCategory,
  getSavedCardInterpretation,
} from "@/utils/tarotReading";
import type { SavedReading } from "@/data/types";

/**
 * Regression: bug #11 (MEDIUM) — the saved-reading detail page contradicted
 * the Mini App result.
 *
 * MiniAppDrawing saved every category reading with a hardcoded
 * `readingType: "general"` and only a human-readable `category` label.
 * ReadingDetail then rendered `getReadingTypeLabel(cards.readingType)` —
 * "GENERAL" for a Health or Wealth reading — and called
 * getCardInterpretation(..., "general"), showing generic meanings for cards
 * the visitor had just read category-specific ones for.
 *
 * Readings saved before this fix only have the label, so everything here has to
 * degrade rather than throw.
 */

const QUEEN = getCardById("queen-of-pentacles")!;
const STRENGTH = getCardById("strength")!;

function savedReading(over: Partial<SavedReading> = {}): SavedReading {
  return {
    id: "r1",
    readingType: "general",
    category: "Health",
    question: "",
    cards: [
      { position: "Current Energy", cardName: "Strength", cardId: "strength", orientation: "reversed" },
      {
        position: "Influence / Challenge",
        cardName: "Queen of Pentacles",
        cardId: "queen-of-pentacles",
        orientation: "upright",
      },
      { position: "Guidance / Direction", cardName: "The Fool", cardId: "the-fool", orientation: "upright" },
    ],
    timestamp: 0,
    ...over,
  };
}

describe("isTarotPosition", () => {
  it("accepts the three canonical positions", () => {
    for (const p of TAROT_POSITIONS) expect(isTarotPosition(p.id)).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isTarotPosition("past")).toBe(false);
    expect(isTarotPosition(undefined)).toBe(false);
    expect(isTarotPosition(null)).toBe(false);
  });
});

describe("getPositionIdFromLabel", () => {
  it("round-trips every position label", () => {
    for (const p of TAROT_POSITIONS) {
      expect(getPositionIdFromLabel(p.label)).toBe(p.id);
    }
  });

  it("tolerates the short forms used in the spread slot captions", () => {
    // MiniAppDrawing renders `label.split(" /")[0]`.
    expect(getPositionIdFromLabel("Current Energy")).toBe("current-energy");
    expect(getPositionIdFromLabel("Influence")).toBe("influence-challenge");
    expect(getPositionIdFromLabel("Guidance")).toBe("guidance-direction");
  });

  it("returns undefined for an unknown label", () => {
    expect(getPositionIdFromLabel("Past")).toBeUndefined();
    expect(getPositionIdFromLabel("")).toBeUndefined();
  });
});

describe("resolveReadingCategory", () => {
  it("prefers a stored category id", () => {
    const r = savedReading({ category: "Love", categoryId: "health" } as never);
    expect(resolveReadingCategory(r)).toBe("health");
  });

  it("falls back to matching the stored label", () => {
    // A reading saved before categoryId existed.
    expect(resolveReadingCategory(savedReading({ category: "Wealth" }))).toBe("wealth");
    expect(resolveReadingCategory(savedReading({ category: "Business" }))).toBe("business");
  });

  it("returns null when the category cannot be determined", () => {
    expect(resolveReadingCategory(savedReading({ category: "Vibes" }))).toBeNull();
    expect(resolveReadingCategory(savedReading({ category: "" }))).toBeNull();
  });

  it("ignores an invalid stored id and still uses the label", () => {
    const r = savedReading({ category: "Travel", categoryId: "career" } as never);
    expect(resolveReadingCategory(r)).toBe("travel");
  });
});

describe("getSavedCardInterpretation", () => {
  it("uses the category interpretation when the category is known", () => {
    const text = getSavedCardInterpretation(
      STRENGTH,
      "reversed",
      resolveReadingCategory(savedReading({ category: "Love" })),
      "current-energy"
    );

    expect(text).toContain(STRENGTH.loveReversed);
  });

  it("routes business to the career fields", () => {
    const text = getSavedCardInterpretation(
      STRENGTH,
      "upright",
      resolveReadingCategory(savedReading({ category: "Business" })),
      "current-energy"
    );

    expect(text).toContain(STRENGTH.careerUpright);
  });

  it("never falls back to a generic meaning when the category is known", () => {
    const category = "health";
    const text = getSavedCardInterpretation(QUEEN, "upright", category, "current-energy");
    expect(text).toContain(QUEEN.generalUpright);
    expect(text).toContain("wellbeing");
  });

  it("degrades to an empty string rather than throwing on unknown ids", () => {
    expect(
      getSavedCardInterpretation(QUEEN, "upright", "nope" as never, "current-energy")
    ).toBe("");
    expect(getSavedCardInterpretation(QUEEN, "upright", "love", "nope" as never)).toBe("");
  });

  it("is safe when the category cannot be resolved at all", () => {
    // Caller should fall back to getCardInterpretation in this case; this just
    // asserts we do not invent text.
    expect(
      getSavedCardInterpretation(STRENGTH, "upright", null, "current-energy")
    ).toBe("");
  });
});

describe("category ids and labels stay in sync", () => {
  it("every category label resolves back to its id", () => {
    for (const c of TAROT_CATEGORIES) {
      expect(resolveReadingCategory(savedReading({ category: c.label }))).toBe(c.id);
    }
  });

  it("isTarotCategory agrees with the id list", () => {
    for (const c of TAROT_CATEGORIES) expect(isTarotCategory(c.id)).toBe(true);
  });
});