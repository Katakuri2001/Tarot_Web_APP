import { tarotCards } from "@/data/tarotCards";
import type { Arcana, Orientation, ReadingType, TarotCardData } from "@/data/types";

export function getCardById(id: string): TarotCardData | undefined {
  return tarotCards.find((c) => c.id === id);
}

export function getCardsByArcana(arcana: Arcana): TarotCardData[] {
  return tarotCards.filter((c) => c.arcana === arcana);
}

export function getCardsBySuit(suit: string): TarotCardData[] {
  return tarotCards.filter((c) => c.suit === suit);
}

export function searchCards(query: string): TarotCardData[] {
  const q = query.toLowerCase();
  return tarotCards.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.toLowerCase().includes(q)) ||
      c.symbolism.toLowerCase().includes(q)
  );
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateOrientation(): Orientation {
  return Math.random() > 0.5 ? "reversed" : "upright";
}

export function generateReadingId(): string {
  return `reading_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function getCardInterpretation(
  card: TarotCardData,
  orientation: Orientation,
  readingType: ReadingType
): string {
  switch (readingType) {
    case "love":
      return orientation === "upright" ? card.loveUpright : card.loveReversed;
    case "career":
      return orientation === "upright" ? card.careerUpright : card.careerReversed;
    case "general":
      return orientation === "upright" ? card.generalUpright : card.generalReversed;
    default:
      return orientation === "upright" ? card.generalUpright : card.generalReversed;
  }
}

export function getPositionMeaning(position: string): string {
  const meanings: Record<string, string> = {
    past: "Past",
    present: "Present",
    future: "Future",
    "current situation": "Current Situation",
    challenge: "Challenge",
    advice: "Advice",
  };
  return meanings[position.toLowerCase()] || position;
}

export function getAllArcanaFilters(): { value: Arcana; label: string }[] {
  return [
    { value: "major", label: "Major Arcana" },
    { value: "wands", label: "Wands" },
    { value: "cups", label: "Cups" },
    { value: "swords", label: "Swords" },
    { value: "pentacles", label: "Pentacles" },
  ];
}

export function getReadingTypeLabel(type: ReadingType): string {
  return {
    daily: "Daily Reading",
    love: "Love Reading",
    career: "Career Reading",
    general: "General Reading",
  }[type];
}

export function getReadingTypePositions(type: ReadingType): { position: string; label: string }[] {
  switch (type) {
    case "daily":
      return [{ position: "daily", label: "Today" }];
    case "love":
    case "career":
    case "general":
      return [
        { position: "past", label: "Past" },
        { position: "present", label: "Present" },
        { position: "future", label: "Future" },
      ];
    default:
      return [];
  }
}
