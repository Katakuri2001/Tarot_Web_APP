import { describe, it, expect } from "vitest";
import { getCardById } from "@/utils/tarotUtils";
import { tarotCards } from "@/data/tarotCards";
import {
  composeOverallReading,
  getCategoryCardReading,
  isTarotCategory,
  getCategoryMeta,
  getPositionMeta,
  TAROT_CATEGORIES,
  TAROT_POSITIONS,
} from "@/utils/tarotReading";
import type { SpreadCard, TarotCategory } from "@/data/types";

/**
 * Regressions: bug #3 (HIGH) — the overall reading double-framed every card
 * and silently dropped content.
 *
 * `readingText` already returned the composed "<lead>: <base>" string, and
 * `firstSentence()` was then applied to that same string. So the overall
 * narrative repeated the position lead-in verbatim after a colon, and kept
 * only the first sentence of the card's actual meaning.
 *
 * Real output before the fix:
 *   "The current energy stands with Justice: In your love life right now:
 *    Honest and balanced partnership."
 * — two colons, the lead-in twice, and "Truth strengthens love." gone.
 *
 * Expectations are read from the card data rather than hardcoded, so these
 * assert the contract ("the full meaning survives") instead of duplicating
 * the dataset.
 */

const SPREAD: SpreadCard[] = [
  { cardId: "justice", orientation: "upright", position: "current-energy" },
  {
    cardId: "the-hanged-man",
    orientation: "reversed",
    position: "influence-challenge",
  },
  {
    cardId: "queen-of-pentacles",
    orientation: "reversed",
    position: "guidance-direction",
  },
];

describe("composeOverallReading", () => {
  it("keeps each card's full meaning, not just its first sentence", () => {
    const overall = composeOverallReading("love", SPREAD, getCardById);

    // justice.loveUpright is "Honest and balanced partnership. Truth
    // strengthens love." — before the fix the second sentence was dropped.
    expect(getCardById("justice")!.loveUpright).toContain(".");
    expect(overall).toContain(getCardById("justice")!.loveUpright);
    expect(overall).toContain("Truth strengthens love.");
  });

  it("does not repeat the position lead-in inside the narrative", () => {
    const overall = composeOverallReading("love", SPREAD, getCardById);

    // The surrounding clause already states the position, so the lead-in is
    // redundant here and reads as a stutter.
    expect(overall).not.toContain("In your love life right now");
    expect(overall).not.toContain("Influencing your relationships");
    expect(overall).not.toContain("Guidance for your heart");
  });

  it("emits exactly one colon per card clause", () => {
    // No card text in the dataset contains a colon, so a colon in the overall
    // reading can only be a clause separator the composer introduced. Before
    // the fix each clause had two (the composer's plus the lead-in's).
    //
    // Asserted as a count rather than a regex: a pattern like
    // /stands with [^:]+:[^:]*:/ happily matches by spanning from one
    // clause's colon to the *next* clause's colon, which says nothing about
    // the clause it started in.
    const overall = composeOverallReading("love", SPREAD, getCardById);

    expect(overall.match(/:/g) ?? []).toHaveLength(3);
  });

  it("splices each card's full meaning straight onto its clause", () => {
    const overall = composeOverallReading("love", SPREAD, getCardById);

    // The precise shape the fix is meant to produce.
    expect(overall).toContain(
      `The current energy stands with Justice: ${getCardById("justice")!.loveUpright}`
    );
    expect(overall).toContain(
      `The Hanged Man (reversed) introduces a blockage or internal resistance: ${
        getCardById("the-hanged-man")!.loveReversed
      }`
    );
    expect(overall).toContain(
      `Finally, Queen of Pentacles (reversed) offers direction: ${
        getCardById("queen-of-pentacles")!.loveReversed
      }`
    );
  });

  it("names all three cards in spread order", () => {
    const overall = composeOverallReading("love", SPREAD, getCardById);

    const iJustice = overall.indexOf("Justice");
    const iHanged = overall.indexOf("The Hanged Man");
    const iQueen = overall.indexOf("Queen of Pentacles");

    expect(iJustice).toBeGreaterThanOrEqual(0);
    expect(iHanged).toBeGreaterThan(iJustice);
    expect(iQueen).toBeGreaterThan(iHanged);
  });

  it("flags reversed cards", () => {
    const overall = composeOverallReading("love", SPREAD, getCardById);

    expect(overall).toContain("The Hanged Man (reversed)");
    expect(overall).toContain("Queen of Pentacles (reversed)");
  });

  it("uses the category closing line", () => {
    expect(
      composeOverallReading("love", SPREAD, getCardById)
    ).toContain("you remain the author of your story");

    expect(
      composeOverallReading("health", SPREAD, getCardById)
    ).toContain("consult a qualified professional");
  });

  it("reflects the category in the opening sentence", () => {
    expect(
      composeOverallReading("business", SPREAD, getCardById)
    ).toContain("business path right now");
  });

  it("returns an empty string unless there are exactly three cards", () => {
    expect(composeOverallReading("love", [], getCardById)).toBe("");
    expect(
      composeOverallReading("love", SPREAD.slice(0, 2), getCardById)
    ).toBe("");
    expect(
      composeOverallReading(
        "love",
        [...SPREAD, { cardId: "the-fool", orientation: "upright", position: "guidance-direction" }],
        getCardById
      )
    ).toBe("");
  });

  it("returns an empty string when any card id is unknown", () => {
    const withBadId: SpreadCard[] = [
      { cardId: "not-a-real-card", orientation: "upright", position: "current-energy" },
      ...SPREAD.slice(1),
    ];

    expect(composeOverallReading("love", withBadId, getCardById)).toBe("");
  });

  it("produces identical output for identical input (deterministic)", () => {
    const a = composeOverallReading("love", SPREAD, getCardById);
    const b = composeOverallReading("love", SPREAD, getCardById);

    expect(a).toBe(b);
    expect(a).not.toBe("");
  });
});

describe("category metadata", () => {
  it("exposes exactly the five documented categories", () => {
    expect(TAROT_CATEGORIES.map((c) => c.id)).toEqual([
      "love",
      "health",
      "business",
      "wealth",
      "travel",
    ]);
  });

  it("validates category ids", () => {
    expect(isTarotCategory("love")).toBe(true);
    expect(isTarotCategory("career")).toBe(false);
    expect(isTarotCategory(null)).toBe(false);
  });

  it("falls back rather than throwing on an unknown category", () => {
    expect(getCategoryMeta("nope" as TarotCategory).id).toBe("love");
  });

  it("exposes the three fixed spread positions in order", () => {
    expect(TAROT_POSITIONS.map((p) => p.id)).toEqual([
      "current-energy",
      "influence-challenge",
      "guidance-direction",
    ]);
  });

  it("falls back rather than throwing on an unknown position", () => {
    expect(getPositionMeta("nope" as never).id).toBe("current-energy");
  });
});

describe("getCategoryCardReading", () => {
  it("routes love to the love fields and business to the career fields", () => {
    const fool = getCardById("the-fool")!;

    expect(getCategoryCardReading(fool, "upright", "love", "current-energy")).toContain(
      fool.loveUpright
    );
    expect(
      getCategoryCardReading(fool, "upright", "business", "current-energy")
    ).toContain(fool.careerUpright);
  });

  it("routes health, wealth and travel to the general fields", () => {
    const fool = getCardById("the-fool")!;

    for (const category of ["health", "wealth", "travel"] as const) {
      expect(
        getCategoryCardReading(fool, "reversed", category, "current-energy")
      ).toContain(fool.generalReversed);
    }
  });

  it("keeps health language non-diagnostic and adds the wellbeing framing", () => {
    const fool = getCardById("the-fool")!;
    const reading = getCategoryCardReading(fool, "upright", "health", "current-energy");

    expect(reading).toContain("wellbeing");
    expect(reading).toMatch(/rest, balance/i);
    // No diagnostic or curative claims.
    expect(reading).not.toMatch(/\b(cure|diagnos|prescrib|symptom|illness|disease)\w*/i);
  });

  it("never returns an empty reading for any card, category, position or orientation", () => {
    const positions = ["current-energy", "influence-challenge", "guidance-direction"] as const;
    const categories = TAROT_CATEGORIES.map((c) => c.id);

    for (const card of tarotCards) {
      for (const category of categories) {
        for (const position of positions) {
          for (const orientation of ["upright", "reversed"] as const) {
            const reading = getCategoryCardReading(
              card,
              orientation,
              category,
              position
            );
            expect(reading.length, `${card.id}/${category}/${position}`).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});
