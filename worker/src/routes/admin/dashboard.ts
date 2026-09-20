import type { Env } from "../../types";
import { jsonOk } from "../../middleware/auth";

export async function handleDashboard(env: Env): Promise<Response> {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + "01";

  const [totalCards, activeCards, totalUsers, totalReadings, todayReadings, monthReadings, mostSelected, recentReadings, recentActivity] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as c FROM tarot_cards").first<{ c: number }>(),
    env.DB.prepare("SELECT COUNT(*) as c FROM tarot_cards WHERE isActive = 1").first<{ c: number }>(),
    env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'user'").first<{ c: number }>(),
    env.DB.prepare("SELECT COUNT(*) as c FROM readings").first<{ c: number }>(),
    env.DB.prepare("SELECT COUNT(*) as c FROM readings WHERE date(createdAt) = date(?)").bind(today).first<{ c: number }>(),
    env.DB.prepare("SELECT COUNT(*) as c FROM readings WHERE date(createdAt) >= date(?)").bind(monthStart).first<{ c: number }>(),
    env.DB.prepare("SELECT cardName as label, COUNT(*) as count FROM reading_cards GROUP BY cardName ORDER BY count DESC LIMIT 1").first<any>(),
    env.DB.prepare(
      `SELECT r.id, r.readingType, r.createdAt, u.name as userName, u.email as userEmail,
        (SELECT COUNT(*) FROM reading_cards rc WHERE rc.readingId = r.id) as cardCount
       FROM readings r LEFT JOIN users u ON u.id = r.userId ORDER BY r.createdAt DESC LIMIT 5`
    ).all<any>(),
    env.DB.prepare(`SELECT id, adminName, action, entityType, entityId, createdAt FROM audit_logs ORDER BY createdAt DESC, id DESC LIMIT 8`).all<any>(),
  ]);

  return jsonOk({
    totalCards: totalCards?.c ?? 0,
    activeCards: activeCards?.c ?? 0,
    totalUsers: totalUsers?.c ?? 0,
    totalReadings: totalReadings?.c ?? 0,
    todayReadings: todayReadings?.c ?? 0,
    monthReadings: monthReadings?.c ?? 0,
    mostSelectedCard: mostSelected?.label ?? null,
    recentReadings: recentReadings.results,
    recentActivity: recentActivity.results,
  });
}
