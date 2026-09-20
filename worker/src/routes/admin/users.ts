import type { Env, JWTPayload } from "../../types";
import { jsonError, jsonOk } from "../../middleware/auth";
import { getPage, pageMeta } from "../../services/queries";

type AuditFn = (action: string, entityType: string, entityId: string | null, metadata?: unknown) => Promise<void>;

export async function handleUsersList(env: Env, url: URL): Promise<Response> {
  const { page, limit, offset } = getPage(url);
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();
  const status = url.searchParams.get("status");
  const sort = url.searchParams.get("sort") || "createdAt";
  const dir = url.searchParams.get("dir") === "asc" ? "ASC" : "DESC";

  const sortCols: Record<string, string> = { createdAt: "createdAt", email: "email", readings: "readingCount", lastReading: "lastReading" };
  const sortCol = sortCols[sort] || "createdAt";

  const where: string[] = ["u.role = 'user'"];
  const params: unknown[] = [];
  if (search) {
    where.push("(LOWER(u.email) LIKE ? OR LOWER(u.name) LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status === "active" || status === "inactive") {
    where.push("u.isActive = ?");
    params.push(status === "active" ? 1 : 0);
  }
  const whereSql = `WHERE ${where.join(" AND ")}`;

  const total = await env.DB.prepare(`SELECT COUNT(*) as c FROM users u ${whereSql}`).bind(...params).first<{ c: number }>();
  const rows = await env.DB.prepare(
    `SELECT u.id, u.name, u.email, u.isActive, u.createdAt, u.lastLogin,
      (SELECT COUNT(*) FROM readings r WHERE r.userId = u.id) as readingCount,
      (SELECT MAX(r.createdAt) FROM readings r WHERE r.userId = u.id) as lastReading
     FROM users u ${whereSql} ORDER BY ${sortCol} ${dir} LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all<any>();

  return jsonOk({ items: rows.results.map((r: any) => ({ ...r, isActive: !!r.isActive })), ...pageMeta(total?.c ?? 0, { page, limit, offset }) });
}

export async function handleUserGet(env: Env, id: string): Promise<Response> {
  const user = await env.DB.prepare(
    `SELECT u.id, u.name, u.email, u.role, u.isActive, u.createdAt, u.lastLogin,
      (SELECT COUNT(*) FROM readings r WHERE r.userId = u.id) as readingCount,
      (SELECT MAX(r.createdAt) FROM readings r WHERE r.userId = u.id) as lastReading
     FROM users u WHERE u.id = ?`
  ).bind(id).first<any>();
  if (!user) return jsonError(404, "User not found.");

  const recentReadings = await env.DB.prepare(
    `SELECT id, readingType, question, createdAt,
      (SELECT COUNT(*) FROM reading_cards rc WHERE rc.readingId = r.id) as cardCount
     FROM readings r WHERE r.userId = ? ORDER BY r.createdAt DESC LIMIT 10`
  ).bind(id).all<any>();

  const readingTypes = await env.DB.prepare(
    `SELECT r.readingType as label, COUNT(*) as count FROM readings r WHERE r.userId = ? GROUP BY r.readingType ORDER BY count DESC`
  ).bind(id).all<any>();

  const popularCards = await env.DB.prepare(
    `SELECT rc.cardName as label, COUNT(*) as count
     FROM reading_cards rc JOIN readings r ON r.id = rc.readingId
     WHERE r.userId = ? GROUP BY rc.cardName ORDER BY count DESC LIMIT 5`
  ).bind(id).all<any>();

  return jsonOk({
    user: { ...user, isActive: !!user.isActive },
    recentReadings: recentReadings.results,
    readingTypes: readingTypes.results,
    popularCards: popularCards.results,
  });
}

export async function handleUserStatus(request: Request, env: Env, id: string, admin: JWTPayload, audit: AuditFn): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid request body.");
  }
  const isActive = body?.isActive === true;
  const user = await env.DB.prepare("SELECT id, name, email, role FROM users WHERE id = ?").bind(id).first<any>();
  if (!user) return jsonError(404, "User not found.");
  if (user.role === "admin") return jsonError(400, "Admin accounts cannot be deactivated here.");

  await env.DB.prepare("UPDATE users SET isActive = ? WHERE id = ?").bind(isActive ? 1 : 0, id).run();
  await audit(isActive ? "user.activated" : "user.deactivated", "users", id, { email: user.email });
  return jsonOk({ ok: true, isActive });
}
