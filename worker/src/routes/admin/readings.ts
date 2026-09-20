import type { Env } from "../../types";
import { jsonError, jsonOk } from "../../middleware/auth";
import { getPage, pageMeta } from "../../services/queries";

const READING_TYPES = ["daily", "love", "career", "general"];
const ORIENTATIONS = ["upright", "reversed"];

export async function handleReadingsList(env: Env, url: URL): Promise<Response> {
  const { page, limit, offset } = getPage(url);
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();
  const readingType = url.searchParams.get("type");
  const orientation = url.searchParams.get("orientation");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const where: string[] = [];
  const params: unknown[] = [];

  if (search) {
    where.push("(LOWER(r.id) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.name) LIKE ? OR EXISTS (SELECT 1 FROM reading_cards rc WHERE rc.readingId = r.id AND LOWER(rc.cardName) LIKE ?))");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (readingType && READING_TYPES.includes(readingType)) {
    where.push("r.readingType = ?");
    params.push(readingType);
  }
  if (orientation && ORIENTATIONS.includes(orientation)) {
    where.push("EXISTS (SELECT 1 FROM reading_cards rc WHERE rc.readingId = r.id AND rc.orientation = ?)");
    params.push(orientation);
  }
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
    where.push("date(r.createdAt) >= date(?)");
    params.push(from);
  }
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    where.push("date(r.createdAt) <= date(?)");
    params.push(to);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const total = await env.DB.prepare(
    `SELECT COUNT(*) as c FROM readings r LEFT JOIN users u ON u.id = r.userId ${whereSql}`
  ).bind(...params).first<{ c: number }>();

  const rows = await env.DB.prepare(
    `SELECT r.id, r.userId, u.name as userName, u.email as userEmail, r.readingType, r.question, r.createdAt,
      (SELECT COUNT(*) FROM reading_cards rc WHERE rc.readingId = r.id) as cardCount
     FROM readings r LEFT JOIN users u ON u.id = r.userId
     ${whereSql} ORDER BY r.createdAt DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all<any>();

  return jsonOk({ items: rows.results, ...pageMeta(total?.c ?? 0, { page, limit, offset }) });
}

export async function handleReadingGet(env: Env, id: string): Promise<Response> {
  const reading = await env.DB.prepare(
    `SELECT r.id, r.userId, u.name as userName, u.email as userEmail, r.readingType, r.question, r.createdAt
     FROM readings r LEFT JOIN users u ON u.id = r.userId WHERE r.id = ?`
  ).bind(id).first<any>();
  if (!reading) return jsonError(404, "Reading not found.");

  const cards = await env.DB.prepare(
    `SELECT cardId, cardName, position, orientation, interpretation FROM reading_cards WHERE readingId = ? ORDER BY id`
  ).bind(id).all<any>();

  return jsonOk({ reading: { ...reading, cards: cards.results } });
}
