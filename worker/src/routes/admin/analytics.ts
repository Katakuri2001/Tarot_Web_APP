import type { Env } from "../../types";
import { jsonOk } from "../../middleware/auth";

export async function handleAnalytics(env: Env, url: URL): Promise<Response> {
  const days = Math.min(365, Math.max(7, Number(url.searchParams.get("days")) || 30));
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const [overTime, readingTypes, popularCards, orientations, userGrowth] = await Promise.all([
    env.DB.prepare(
      `SELECT date(createdAt) as label, COUNT(*) as count FROM readings
       WHERE date(createdAt) >= date(?) GROUP BY date(createdAt) ORDER BY label`
    ).bind(since).all<any>(),
    env.DB.prepare(
      `SELECT readingType as label, COUNT(*) as count FROM readings
       WHERE date(createdAt) >= date(?) GROUP BY readingType ORDER BY count DESC`
    ).bind(since).all<any>(),
    env.DB.prepare(
      `SELECT rc.cardName as label, COUNT(*) as count FROM reading_cards rc
       JOIN readings r ON r.id = rc.readingId WHERE date(r.createdAt) >= date(?)
       GROUP BY rc.cardName ORDER BY count DESC LIMIT 10`
    ).bind(since).all<any>(),
    env.DB.prepare(
      `SELECT rc.orientation as label, COUNT(*) as count FROM reading_cards rc
       JOIN readings r ON r.id = rc.readingId WHERE date(r.createdAt) >= date(?)
       GROUP BY rc.orientation`
    ).bind(since).all<any>(),
    env.DB.prepare(
      `SELECT date(createdAt) as label, COUNT(*) as count FROM users
       WHERE role = 'user' AND date(createdAt) >= date(?) GROUP BY date(createdAt) ORDER BY label`
    ).bind(since).all<any>(),
  ]);

  const byLabel = (rows: any[], days: number) => {
    const map = new Map(rows.map((r) => [r.label, r.count]));
    const out: { label: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      out.push({ label: d, count: map.get(d) ?? 0 });
    }
    return out;
  };

  const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const [week, month] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as c FROM readings WHERE date(createdAt) >= date(?)").bind(weekStart).first<{ c: number }>(),
    env.DB.prepare("SELECT COUNT(*) as c FROM readings WHERE date(createdAt) >= date('now', 'start of month')").first<{ c: number }>(),
  ]);

  return jsonOk({
    days,
    readingsOverTime: byLabel(overTime.results, days),
    readingTypes: readingTypes.results,
    popularCards: popularCards.results,
    orientations: orientations.results,
    userGrowth: byLabel(userGrowth.results, days),
    weeklyReadings: [{ label: "Last 7 days", count: week?.c ?? 0 }],
    monthlyReadings: [{ label: "This month", count: month?.c ?? 0 }],
  });
}
