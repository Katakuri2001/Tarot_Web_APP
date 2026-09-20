import type { Env } from "../../types";
import { jsonOk } from "../../middleware/auth";
import { getPage, pageMeta } from "../../services/queries";

export async function handleAuditList(env: Env, url: URL): Promise<Response> {
  const { page, limit, offset } = getPage(url);
  const action = (url.searchParams.get("action") || "").trim();

  const where: string[] = [];
  const params: unknown[] = [];
  if (action) {
    where.push("action = ?");
    params.push(action);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const total = await env.DB.prepare(`SELECT COUNT(*) as c FROM audit_logs ${whereSql}`).bind(...params).first<{ c: number }>();
  const rows = await env.DB.prepare(
    `SELECT id, adminId, adminName, action, entityType, entityId, metadata, createdAt
     FROM audit_logs ${whereSql} ORDER BY createdAt DESC, id DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all<any>();

  return jsonOk({ items: rows.results, ...pageMeta(total?.c ?? 0, { page, limit, offset }) });
}
