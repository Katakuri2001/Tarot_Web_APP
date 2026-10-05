import type {
  Orientation,
  TarotCardData,
  TarotCategory,
  TarotPosition,
  SpreadCard,
} from "@/data/types";

/**
 * Category-aware reading layer for the 3-card Mini App flow.
 *
 * The engine stays category-independent: positions never change. Only the
 * framing of the interpretation changes with the selected category, built on
 * top of the existing per-card fields (love*, career*, general*). No card
 * dataset is duplicated.
 */

export interface CategoryMeta {
  id: TarotCategory;
  label: string;
  icon: string;
  /** One-line atmosphere used on the selection and result screens. */
  tagline: string;
}

export const TAROT_CATEGORIES: readonly CategoryMeta[] = [
  { id: "love", label: "Love", icon: "♡", tagline: "Soft celestial romance" },
  { id: "health", label: "Health", icon: "❧", tagline: "Calm, restorative balance" },
  { id: "business", label: "Business", icon: "✦", tagline: "Structured confidence" },
  { id: "wealth", label: "Wealth", icon: "◈", tagline: "Abundance and luxury" },
  { id: "travel", label: "Travel", icon: "✈", tagline: "Horizons and journeys" },
] as const;

export const DEFAULT_CATEGORY: TarotCategory = "love";

export function isTarotCategory(value: unknown): value is TarotCategory {
  return (
    typeof value === "string" &&
    (TAROT_CATEGORIES as readonly CategoryMeta[]).some((c) => c.id === value)
  );
}

export function getCategoryMeta(id: TarotCategory): CategoryMeta {
  return (
    TAROT_CATEGORIES.find((c) => c.id === id) ??
    TAROT_CATEGORIES.find((c) => c.id === DEFAULT_CATEGORY)!
  );
}

export interface PositionMeta {
  id: TarotPosition;
  step: "CARD 1" | "CARD 2" | "CARD 3";
  label: string;
  prompt: string;
  blurb: string;
}

/** Canonical 3-card spread structure — category independent. */
export const TAROT_POSITIONS: readonly PositionMeta[] = [
  {
    id: "current-energy",
    step: "CARD 1",
    label: "Current Energy",
    prompt: "Choose the card that draws your attention.",
    blurb: "What energy currently surrounds this area of your life?",
  },
  {
    id: "influence-challenge",
    step: "CARD 2",
    label: "Influence / Challenge",
    prompt: "Choose another card.",
    blurb: "What is influencing the situation right now?",
  },
  {
    id: "guidance-direction",
    step: "CARD 3",
    label: "Guidance / Direction",
    prompt: "One final card.",
    blurb: "What should you consider next?",
  },
] as const;

export function getPositionMeta(id: TarotPosition): PositionMeta {
  return (
    TAROT_POSITIONS.find((p) => p.id === id) ?? TAROT_POSITIONS[0]
  );
}

/**
 * Lead-in sentence framing the card's base meaning for each
 * category × position pair. These are the "interpretation layer" that keeps
 * the result category-aware without duplicating the card dataset.
 */
const POSITION_LEADS: Record<TarotPosition, Record<TarotCategory, string>> = {
  "current-energy": {
    love: "In your love life right now",
    health: "In matters of wellbeing right now",
    business: "In your work and business right now",
    wealth: "Around your finances right now",
    travel: "Around your plans to travel right now",
  },
  "influence-challenge": {
    love: "Influencing your relationships",
    health: "Influencing your energy and wellbeing",
    business: "Influencing your professional path",
    wealth: "Influencing your financial situation",
    travel: "Influencing your journeys",
  },
  "guidance-direction": {
    love: "Guidance for your heart",
    health: "Guidance for your self-care",
    business: "Guidance for your next move",
    wealth: "Guidance for your money mindset",
    travel: "Guidance for your road ahead",
  },
};

/** Base card meaning reused per category from the existing dataset. */
function getBaseMeaning(
  card: TarotCardData,
  orientation: Orientation,
  category: TarotCategory
): string {
  const upright = orientation === "upright";
  switch (category) {
    case "love":
      return upright ? card.loveUpright : card.loveReversed;
    case "business":
      return upright ? card.careerUpright : card.careerReversed;
    default:
      return upright ? card.generalUpright : card.generalReversed;
  }
}

/**
 * Category-aware interpretation for a single card in a single position.
 * Health language is deliberately non-diagnostic: reflective, not medical.
 */
export function getCategoryCardReading(
  card: TarotCardData,
  orientation: Orientation,
  category: TarotCategory,
  position: TarotPosition
): string {
  const lead = POSITION_LEADS[position][category];
  const base = getBaseMeaning(card, orientation, category);
  if (category === "health") {
    return `${lead}: ${base} Focus on rest, balance, and small supportive habits for your wellbeing.`;
  }
  return `${lead}: ${base}`;
}

/** First sentence of a reading, for compact spread summaries. */
export function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]*[.!?]/);
  return (match ? match[0] : text).trim();
}

const OVERALL_CLOSINGS: Record<TarotCategory, string> = {
  love: "Let this reflection guide your heart, not dictate it — you remain the author of your story.",
  health: "Treat this as a prompt for rest, balance, and care — and always consult a qualified professional for medical concerns.",
  business: "Use this perspective to inform your next decision, and remember that strategy and steady action shape the outcome.",
  wealth: "Let this be a lens on your financial habits and mindset — grounded choices create lasting abundance.",
  travel: "Carry this reflection with you as you move — every journey shifts when you travel with intention.",
};

/**
 * Deterministic, rule-based overall reading that weaves the three cards
 * into one coherent narrative for the selected category. Built from the
 * existing card content — no invented free-form sentences.
 */
export function composeOverallReading(
  category: TarotCategory,
  cards: SpreadCard[],
  getCard: (id: string) => TarotCardData | undefined,
  readingText: (sc: SpreadCard) => string
): string {
  const meta = getCategoryMeta(category);
  if (cards.length !== 3) return "";

  const [first, second, third] = cards;
  const c1 = getCard(first.cardId);
  const c2 = getCard(second.cardId);
  const c3 = getCard(third.cardId);
  if (!c1 || !c2 || !c3) return "";

  const short1 = firstSentence(readingText(first));
  const short2 = firstSentence(readingText(second));
  const short3 = firstSentence(readingText(third));

  const influenceVerb =
    second.orientation === "reversed"
      ? "introduces a blockage or internal resistance"
      : "introduces a supporting force or opportunity";

  return [
    `Taken together, these three cards paint a picture of your ${meta.label.toLowerCase()} path right now.`,
    `The current energy stands with ${c1.name}${first.orientation === "reversed" ? " (reversed)" : ""}: ${short1}`,
    `${c2.name}${second.orientation === "reversed" ? " (reversed)" : ""} ${influenceVerb}: ${short2}`,
    `Finally, ${c3.name}${third.orientation === "reversed" ? " (reversed)" : ""} offers direction: ${short3}`,
    OVERALL_CLOSINGS[category],
  ].join(" ");
}
