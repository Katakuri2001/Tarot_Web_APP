export type Arcana = "major" | "wands" | "cups" | "swords" | "pentacles";
export type Orientation = "upright" | "reversed";
export type ReadingType = "daily" | "love" | "career" | "general";

/** Category-first reading path chosen before any cards are drawn. */
export type TarotCategory = "love" | "health" | "business" | "wealth" | "travel";

/** Fixed role each card plays within the 3-card spread. */
export type TarotPosition =
  | "current-energy"
  | "influence-challenge"
  | "guidance-direction";

export interface TarotCardData {
  id: string;
  name: string;
  arcana: Arcana;
  suit: string;
  number: number;
  keywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
  loveUpright: string;
  loveReversed: string;
  careerUpright: string;
  careerReversed: string;
  generalUpright: string;
  generalReversed: string;
  advice: string;
  symbolism: string;
}

/** One revealed position of the 3-card spread. */
export interface SpreadCard {
  cardId: string;
  orientation: Orientation;
  position: TarotPosition;
}

export interface CardInReading {
  position: string;
  cardId: string;
  orientation: Orientation;
}

export interface ReadingState {
  readingId: string;
  readingType: ReadingType;
  category: string;
  question: string;
  cards: CardInReading[];
  timestamp: number;
}

export interface SavedReading {
  id: string;
  readingType: ReadingType;
  category: string;
  question: string;
  cards: Array<{
    position: string;
    cardName: string;
    cardId: string;
    orientation: Orientation;
  }>;
  timestamp: number;
}

export const ARCANA_LABELS: Record<Arcana, string> = {
  major: "Major Arcana",
  wands: "Wands",
  cups: "Cups",
  swords: "Swords",
  pentacles: "Pentacles",
};

export const SUIT_SYMBOLS: Record<Arcana, string> = {
  major: "✦",
  wands: "♆",
  cups: "♀",
  swords: "⚷",
  pentacles: "◈",
};
