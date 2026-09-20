import type { Env } from "../../types";
import { jsonError, jsonOk } from "../../middleware/auth";

const SETTING_KEYS = ["websiteName", "tagline", "readingsEnabled", "maintenanceMode", "soundEnabled", "animationsEnabled"] as const;
type SettingKey = typeof SETTING_KEYS[number];

const DEFAULTS: Record<SettingKey, string> = {
  websiteName: "Velora",
  tagline: "Discover what the cards reveal.",
  readingsEnabled: "true",
  maintenanceMode: "false",
  soundEnabled: "true",
  animationsEnabled: "true",
};

const BOOL_KEYS: SettingKey[] = ["readingsEnabled", "maintenanceMode", "soundEnabled", "animationsEnabled"];

function serialize(rows: any[]): Record<string, string | boolean> {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const out: Record<string, string | boolean> = {};
  for (const key of SETTING_KEYS) {
    const raw = map.get(key) ?? DEFAULTS[key];
    out[key] = BOOL_KEYS.includes(key) ? raw === "true" : raw;
  }
  return out;
}

export async function handleSettingsGet(env: Env): Promise<Response> {
  const rows = await env.DB.prepare(`SELECT key, value FROM admin_settings`).all<any>();
  return jsonOk({ settings: serialize(rows.results) });
}

export async function handleSettingsUpdate(request: Request, env: Env, audit: (action: string, entityType: string, entityId: string | null, metadata?: unknown) => Promise<void>): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid request body.");
  }
  const settings = body?.settings;
  if (typeof settings !== "object" || settings === null) {
    return jsonError(422, "Please correct the highlighted fields.", { settings: "Settings object is required." });
  }

  const errors: Record<string, string> = {};
  const updates: [string, string][] = [];

  for (const key of SETTING_KEYS) {
    if (!(key in settings)) continue;
    const value = settings[key];
    if (BOOL_KEYS.includes(key)) {
      if (typeof value !== "boolean") errors[key] = "Must be true or false.";
      else updates.push([key, String(value)]);
    } else if (typeof value !== "string" || value.trim().length < 1 || value.length > 200) {
      errors[key] = "Must be 1-200 characters.";
    } else {
      updates.push([key, value.trim()]);
    }
  }

  if (Object.keys(errors).length) return jsonError(422, "Please correct the highlighted fields.", errors);
  if (!updates.length) return jsonError(400, "No settings provided.");

  const stmt = env.DB.prepare(
    `INSERT INTO admin_settings (key, value, updatedAt) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = datetime('now')`
  );
  await env.DB.batch(updates.map(([key, value]) => stmt.bind(key, value)));

  await audit("settings.updated", "admin_settings", null, { keys: updates.map(([k]) => k) });
  const rows = await env.DB.prepare(`SELECT key, value FROM admin_settings`).all<any>();
  return jsonOk({ settings: serialize(rows.results) });
}
