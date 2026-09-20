import type { Env } from "../types";

export async function logAudit(
  env: Env,
  adminId: string,
  adminName: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata?: unknown
): Promise<void> {
  try {
    await env.DB.prepare(
      "INSERT INTO audit_logs (adminId, adminName, action, entityType, entityId, metadata) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(adminId, adminName, action, entityType, entityId, metadata ? JSON.stringify(metadata).slice(0, 2000) : null)
      .run();
  } catch (err) {
    console.error("Audit log failed:", err instanceof Error ? err.message : String(err));
  }
}
