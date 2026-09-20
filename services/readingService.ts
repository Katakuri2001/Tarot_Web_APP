import { tarotCards } from "@/data/tarotCards";
import { shuffleArray, generateReadingId, generateOrientation } from "@/utils/tarotUtils";
import type { ReadingType, SavedReading, CardInReading, TarotCardData } from "@/data/types";

export interface ReadingAction {
  type: "SHUFFLE" | "SELECT_CARD" | "COMPLETE" | "RESET";
  payload?: any;
}

export interface ReadingStateType {
  readingId: string;
  readingType: ReadingType;
  question: string;
  deck: string[];
  selectedCards: CardInReading[];
  currentStep: "idle" | "shuffling" | "selecting" | "revealing" | "complete";
}

export function createInitialReadingState(
  type: ReadingType,
  question: string
): ReadingStateType {
  const allCardIds = tarotCards.map((c: TarotCardData) => c.id);
  const allIds = shuffleArray(allCardIds) as string[];
  return {
    readingId: generateReadingId(),
    readingType: type,
    question,
    deck: allIds,
    selectedCards: [] as CardInReading[],
    currentStep: "idle" as "idle" | "shuffling" | "selecting" | "revealing" | "complete",
  };
}

/**
 * Cloudflare KV integration for persisting readings history
 * When KV binding is provided via Next.js environment, uses KV;
 * otherwise falls back to localStorage for development.
 */
export class ReadingStorage {
  private kv: any;
  private readonly kvNamespace: string = "velora_readings";

  constructor(kv?: any) {
    this.kv = kv;
  }

  async getReadings(): Promise<SavedReading[]> {
    try {
      // Use Cloudflare KV if available
      if (this.kv) {
        const raw = await this.kv.get(this.kvNamespace, "json");
        return raw || [];
      }
      // Fall back to localStorage
      const raw = localStorage.getItem("velora_readings");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async saveReading(reading: SavedReading): Promise<void> {
    try {
      // Use Cloudflare KV if available
      if (this.kv) {
        const currentReadings = await this.getReadings();
        currentReadings.unshift(reading);
        await this.kv.put(this.kvNamespace, JSON.stringify(currentReadings));
        return;
      }
      // Fall back to localStorage
      const currentReadings = getReadingsFromStorage();
      currentReadings.unshift(reading);
      localStorage.setItem("velora_readings", JSON.stringify(currentReadings));
    } catch {
      // Silently fail - storage might be full or unavailable
    }
  }
}

/**
 * Factory function to create a ReadingStorage instance
 * @param kv optional Cloudflare KV binding (from Next.js environment)
 */
export function createReadingStorage(kv?: any): ReadingStorage {
  return new ReadingStorage(kv);
}

// Default export for use without KV (localStorage only)
export function getReadingsFromStorage(): SavedReading[] {
  const raw = localStorage.getItem("velora_readings");
  return raw ? JSON.parse(raw) : [];
}

export function saveReadingToStorage(reading: SavedReading): void {
  try {
    const currentReadings = getReadingsFromStorage();
    currentReadings.unshift(reading);
    localStorage.setItem("velora_readings", JSON.stringify(currentReadings));
  } catch {
    // Silently fail
  }
}

// Keep backward compatibility exports
export function hasIntroPlayed(): boolean {
  return sessionStorage.getItem("velora_intro_played") === "true";
}

export function markIntroPlayed(): void {
  sessionStorage.setItem("velora_intro_played", "true");
}