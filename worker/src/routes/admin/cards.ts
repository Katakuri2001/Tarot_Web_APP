import type { Env } from "../../types";
import { jsonError, jsonOk } from "../../middleware/auth";
import { rateLimitKey } from "./shared";
import { validateCard, slugify } from "../../services/validation";
import { getPage, pageMeta } from "../../services/queries";

type AuditFn = (action: string, entityType: string, entityId: string | null, metadata?: unknown) => Promise<void>;

const CARD_SELECT = `SELECT id, name, slug, arcana, suit, number, keywords, symbolism,
  uprightMeaning, reversedMeaning, loveUpright, loveReversed, careerUpright, careerReversed,
  generalUpright, generalReversed, advice, isActive, imageKey, createdAt, updatedAt
  FROM tarot_cards`;

function serializeCard(row: any) {
  return {
    ...row,
    keywords: JSON.parse(row.keywords || "[]"),
    isActive: !!row.isActive,
    imageUrl: row.imageKey ? `/api/admin/cards/${row.id}/image/raw` : null,
  };
}

function serializeRow(row: any) {
  const { imageKey, ...rest } = row;
  return { ...rest, keywords: JSON.parse(row.keywords || "[]"), isActive: !!row.isActive, imageKey };
}

export async function handleCardsList(env: Env, url: URL): Promise<Response> {
  const { page, limit, offset } = getPage(url);
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();
  const arcana = url.searchParams.get("arcana");
  const status = url.searchParams.get("status");
  const sort = url.searchParams.get("sort") || "number";
  const dir = url.searchParams.get("dir") === "desc" ? "DESC" : "ASC";

  const sortCols: Record<string, string> = { name: "name", number: "number", updated: "updatedAt", status: "isActive" };
  const sortCol = sortCols[sort] || "number";

  const where: string[] = [];
  const params: unknown[] = [];
  if (search) {
    where.push("(LOWER(name) LIKE ? OR LOWER(slug) LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (arcana && ["major", "wands", "cups", "swords", "pentacles"].includes(arcana)) {
    where.push("arcana = ?");
    params.push(arcana);
  }
  if (status === "active" || status === "inactive") {
    where.push("isActive = ?");
    params.push(status === "active" ? 1 : 0);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const total = await env.DB.prepare(`SELECT COUNT(*) as c FROM tarot_cards ${whereSql}`).bind(...params).first<{ c: number }>();
  const rows = await env.DB.prepare(`${CARD_SELECT} ${whereSql} ORDER BY ${sortCol} ${dir} LIMIT ? OFFSET ?`)
    .bind(...params, limit, offset)
    .all<any>();

  return jsonOk({ items: rows.results.map(serializeCard), ...pageMeta(total?.c ?? 0, { page, limit, offset }) });
}

export async function handleCardGet(env: Env, id: string): Promise<Response> {
  const row = await env.DB.prepare(`${CARD_SELECT} WHERE id = ? OR slug = ?`).bind(id, id).first<any>();
  if (!row) return jsonError(404, "Tarot card not found.");
  return jsonOk({ card: serializeCard(row) });
}

export async function handleCardCreate(request: Request, env: Env, audit: AuditFn): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid request body.");
  }
  const { value, errors } = validateCard(body);
  if (!value) return jsonError(422, "Please correct the highlighted fields.", errors);

  const id = crypto.randomUUID();
  const existing = await env.DB.prepare("SELECT id FROM tarot_cards WHERE slug = ?").bind(value.slug).first();
  if (existing) return jsonError(422, "Please correct the highlighted fields.", { slug: "A card with this slug already exists." });

  await env.DB.prepare(
    `INSERT INTO tarot_cards (id, name, slug, arcana, suit, number, keywords, symbolism, uprightMeaning, reversedMeaning,
     loveUpright, loveReversed, careerUpright, careerReversed, generalUpright, generalReversed, advice, isActive)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id, value.name, value.slug, value.arcana, value.suit, value.number, JSON.stringify(value.keywords),
      value.symbolism, value.uprightMeaning, value.reversedMeaning, value.loveUpright, value.loveReversed,
      value.careerUpright, value.careerReversed, value.generalUpright, value.generalReversed, value.advice,
      value.isActive ? 1 : 0
    )
    .run();

  await audit("card.created", "tarot_cards", id, { name: value.name });
  const row = await env.DB.prepare(`${CARD_SELECT} WHERE id = ?`).bind(id).first<any>();
  return jsonOk({ card: serializeCard(row) }, 201);
}

export async function handleCardUpdate(request: Request, env: Env, id: string, audit: AuditFn): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid request body.");
  }
  const existing = await env.DB.prepare("SELECT id, slug FROM tarot_cards WHERE id = ?").bind(id).first();
  if (!existing) return jsonError(404, "Tarot card not found.");

  const { value, errors } = validateCard(body);
  if (!value) return jsonError(422, "Please correct the highlighted fields.", errors);

  const dupe = await env.DB.prepare("SELECT id FROM tarot_cards WHERE slug = ? AND id != ?").bind(value.slug, id).first();
  if (dupe) return jsonError(422, "Please correct the highlighted fields.", { slug: "Another card already uses this slug." });

  await env.DB.prepare(
    `UPDATE tarot_cards SET name = ?, slug = ?, arcana = ?, suit = ?, number = ?, keywords = ?, symbolism = ?,
     uprightMeaning = ?, reversedMeaning = ?, loveUpright = ?, loveReversed = ?, careerUpright = ?, careerReversed = ?,
     generalUpright = ?, generalReversed = ?, advice = ?, isActive = ?, updatedAt = datetime('now') WHERE id = ?`
  )
    .bind(
      value.name, value.slug, value.arcana, value.suit, value.number, JSON.stringify(value.keywords),
      value.symbolism, value.uprightMeaning, value.reversedMeaning, value.loveUpright, value.loveReversed,
      value.careerUpright, value.careerReversed, value.generalUpright, value.generalReversed, value.advice,
      value.isActive ? 1 : 0, id
    )
    .run();

  await audit("card.updated", "tarot_cards", id, { name: value.name, slugChanged: (existing as any).slug !== value.slug });
  const row = await env.DB.prepare(`${CARD_SELECT} WHERE id = ?`).bind(id).first<any>();
  return jsonOk({ card: serializeCard(row) });
}

export async function handleCardStatus(request: Request, env: Env, id: string, audit: AuditFn): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid request body.");
  }
  const isActive = body?.isActive === true;
  const existing = await env.DB.prepare("SELECT id, name FROM tarot_cards WHERE id = ?").bind(id).first<any>();
  if (!existing) return jsonError(404, "Tarot card not found.");
  await env.DB.prepare("UPDATE tarot_cards SET isActive = ?, updatedAt = datetime('now') WHERE id = ?").bind(isActive ? 1 : 0, id).run();
  await audit(isActive ? "card.activated" : "card.deactivated", "tarot_cards", id, { name: existing.name });
  return jsonOk({ ok: true, isActive });
}

export async function handleCardImage(request: Request, env: Env, id: string, audit: AuditFn): Promise<Response> {
  if (!rateLimitKey(request, "upload", env)) {
    return jsonError(429, "Too many uploads. Please wait a moment.");
  }
  const card = await env.DB.prepare("SELECT id, name, imageKey FROM tarot_cards WHERE id = ?").bind(id).first<any>();
  if (!card) return jsonError(404, "Tarot card not found.");

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return jsonError(400, "No image file provided.");

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return jsonError(422, "Image must be JPEG, PNG or WEBP.");
  }
  const maxBytes = Number(env.MAX_IMAGE_BYTES || 5 * 1024 * 1024);
  if (file.size > maxBytes) {
    return jsonError(413, `Image must be smaller than ${Math.round(maxBytes / 1024 / 1024)}MB.`);
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key = `cards/${id}-${Date.now()}.${ext}`;
  await env.BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const oldKey = card.imageKey;
  await env.DB.prepare("UPDATE tarot_cards SET imageKey = ?, updatedAt = datetime('now') WHERE id = ?").bind(key, id).run();

  if (oldKey && oldKey !== key) {
    await env.BUCKET.delete(oldKey).catch(() => undefined);
  }
  await audit("card.image_changed", "tarot_cards", id, { key });

  return jsonOk({ ok: true, imageKey: key, imageUrl: `/api/admin/cards/${id}/image/raw` });
}
