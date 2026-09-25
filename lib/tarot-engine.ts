import { tarotCards } from "@/data/tarotCards";
import { shuffleArray, generateOrientation, getCardInterpretation, getReadingTypePositions } from "@/utils/tarotUtils";
import type { TarotCardData, Orientation, ReadingType, CardInReading } from "@/data/types";
import { getCardById } from "@/utils/tarotUtils";
import { getReadingTypeLabel } from "@/utils/tarotUtils";
import { generateReadingId } from "@/utils/tarotUtils";

/**
 * Tarot Engine — Pure business logic for card drawing and reading generation.
 *
 * This module is completely decoupled from UI components. It handles:
 * - Card selection and randomization
 * - Orientation determination
 * - Reading generation
 * - Recent-card avoidance for rerolls
 *
 * No UI framework dependencies. No side effects.
 */

export interface EngineConfig {
  readingType: ReadingType;
  excludeRecentCards?: string[];
}

export interface DrawResult {
  card: TarotCardData;
  orientation: Orientation;
  position: string;
  reading: string;
  readingType: ReadingType;
}

export interface ReadingSession {
  readingId: string;
  readingType: ReadingType;
  cards: DrawResult[];
  question: string;
  timestamp: number;
}

export interface TarotEngine {
  config: EngineConfig;
  deck: string[];
  drawnCardIds: string[];
  recentCards: string[];
  readingSession: ReadingSession | null;
  numCards: number;

  initialize(config: EngineConfig): void;
  drawCard(): DrawResult | null;
  drawAllCards(): DrawResult[];
  reset(): void;
  getRemainingCount(): number;
  canDrawMore(): boolean;
  getPositions(): { position: string; label: string }[];
}

const RECENT_AVOIDANCE_COUNT = 3;

/**
 * Create a new Tarot Engine instance.
 */
export function createTarotEngine(): TarotEngine {
  let config: EngineConfig = { readingType: "daily" };
  let deck: string[] = [];
  let drawnCardIds: string[] = [];
  let recentCards: string[] = [];
  let readingSession: ReadingSession | null = null;

  function getExcludedCards(): string[] {
    const exclude = [...config.excludeRecentCards || []];
    // Add the most recent cards to exclusion list
    const recent = recentCards.slice(-RECENT_AVOIDANCE_COUNT);
    for (const cardId of recent) {
      if (!exclude.includes(cardId)) {
        exclude.push(cardId);
      }
    }
    return exclude;
  }

  function getAvailableDeck(): string[] {
    const excluded = getExcludedCards();
    return deck.filter((id) => !excluded.includes(id));
  }

  return {
    config,
    deck: [],
    drawnCardIds: [],
    recentCards: [],
    readingSession: null,
    numCards: config.readingType === "daily" ? 1 : 3,

    initialize(cfg: EngineConfig) {
      config = { ...cfg };
      this.numCards = config.readingType === "daily" ? 1 : 3;
      const allIds = tarotCards.map((c) => c.id);
      deck = shuffleArray(allIds);
      drawnCardIds = [];
      readingSession = null;
    },

    drawCard(): DrawResult | null {
      const available = getAvailableDeck();
      if (available.length === 0) return null;

      const shuffled = shuffleArray(available);
      const selectedId = shuffled[0];
      const card = getCardById(selectedId);
      if (!card) return null;

      const orientation = generateOrientation();
      const positions = getReadingTypePositions(config.readingType);
      const position = positions[drawnCardIds.length]?.position || "past";

      const interpretation = getCardInterpretation(card, orientation, config.readingType);
      const label = getReadingTypeLabel(config.readingType);

      const result: DrawResult = {
        card,
        orientation,
        position,
        reading: interpretation,
        readingType: config.readingType,
      };

      drawnCardIds.push(selectedId);

      // Update recent cards
      if (!recentCards.includes(selectedId)) {
        recentCards.push(selectedId);
      } else {
        recentCards = recentCards.filter((id) => id !== selectedId);
        recentCards.push(selectedId);
      }

      return result;
    },

    drawAllCards(): DrawResult[] {
      const results: DrawResult[] = [];
      for (let i = 0; i < this.numCards; i++) {
        const result = this.drawCard();
        if (result) {
          results.push(result);
        } else {
          break;
        }
      }
      return results;
    },

    reset() {
      const allIds = tarotCards.map((c) => c.id);
      deck = shuffleArray(allIds);
      drawnCardIds = [];
      readingSession = null;
    },

    getRemainingCount() {
      return getAvailableDeck().length;
    },

    canDrawMore() {
      return getAvailableDeck().length > 0;
    },

    getPositions() {
      return getReadingTypePositions(config.readingType);
    },
  };
}

/**
 * Create a ReadingSession from drawn results.
 */
export function createReadingSession(
  readingType: ReadingType,
  cards: DrawResult[],
  question: string
): ReadingSession {
  return {
    readingId: generateReadingId(),
    readingType,
    cards,
    question,
    timestamp: Date.now(),
  };
}

/**
 * Utility: Check if a card ID should be avoided (for recent-result avoidance).
 */
export function shouldAvoidCard(cardId: string, recentCards: string[]): boolean {
  return recentCards.slice(-RECENT_AVOIDANCE_COUNT).includes(cardId);
}

/**
 * Utility: Get a random card that is not in the recent exclusion list.
 */
export function getRandomCardExcluding(recentIds: string[]): TarotCardData | null {
  const available = tarotCards.filter((c) => !recentIds.includes(c.id));
  if (available.length === 0) return tarotCards[Math.floor(Math.random() * tarotCards.length)];
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Utility: Determine how many cards to draw based on reading type.
 */
export function getNumCardsForType(readingType: ReadingType): number {
  return readingType === "daily" ? 1 : 3;
}

/**
 * Utility: Get the card name and orientation label for display.
 */
export function getCardDisplayInfo(card: TarotCardData, orientation: Orientation): string {
  return `${card.name} ${orientation === "reversed" ? "(Reversed)" : "(Upright)"}`;
}

// Re-export utilities that the engine depends on

export { shuffleArray, generateOrientation, getCardInterpretation, getReadingTypePositions, getReadingTypeLabel };
