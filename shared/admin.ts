export interface AdminUser { id: string; name: string | null; email: string; role: "admin" | "user"; isActive: boolean; createdAt: string; lastLogin: string | null; readingCount?: number; lastReading?: string | null }
export interface TarotCard { id: string; name: string; slug: string; arcana: "major" | "wands" | "cups" | "swords" | "pentacles"; suit: string | null; number: number; keywords: string[]; symbolism: string; uprightMeaning: string; reversedMeaning: string; loveUpright: string; loveReversed: string; careerUpright: string; careerReversed: string; generalUpright: string; generalReversed: string; advice: string; isActive: boolean; imageKey: string | null; imageUrl: string | null; createdAt: string; updatedAt: string }
export interface ReadingCard { cardId: string | null; cardName: string; position: string; orientation: "upright" | "reversed"; interpretation: string | null }
export interface Reading { id: string; userId: string | null; userName: string | null; userEmail: string | null; readingType: "daily" | "love" | "career" | "general"; question: string | null; createdAt: string; cardCount: number; cards?: ReadingCard[] }
export interface PageData<T> { items: T[]; page: number; limit: number; total: number; totalPages: number }
export interface SeriesPoint { label: string; count: number }
export interface Analytics { days: number; readingsOverTime: SeriesPoint[]; readingTypes: SeriesPoint[]; popularCards: SeriesPoint[]; orientations: SeriesPoint[]; userGrowth: SeriesPoint[]; weeklyReadings: SeriesPoint[]; monthlyReadings: SeriesPoint[] }
export interface Dashboard { totalCards: number; activeCards: number; totalUsers: number; totalReadings: number; todayReadings: number; monthReadings: number; mostSelectedCard: string | null; recentReadings: Reading[]; recentActivity: AuditLog[] }
export interface AuditLog { id: number; adminId: string; adminName: string | null; action: string; entityType: string; entityId: string | null; metadata: string | null; createdAt: string }
export interface Settings { websiteName: string; tagline: string; readingsEnabled: boolean; maintenanceMode: boolean; soundEnabled: boolean; animationsEnabled: boolean }
export interface UserDetail { user: AdminUser; recentReadings: Reading[]; readingTypes: SeriesPoint[]; popularCards: SeriesPoint[] }

export const ARCANA_LABELS: Record<string, string> = {
  major: "Major Arcana",
  wands: "Wands",
  cups: "Cups",
  swords: "Swords",
  pentacles: "Pentacles",
};

export const READING_TYPE_LABELS: Record<string, string> = {
  daily: "Daily",
  love: "Love",
  career: "Career",
  general: "General",
};

export const POSITION_LABELS: Record<string, string> = {
  past: "Past",
  present: "Present",
  future: "Future",
  daily: "Today",
};

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
