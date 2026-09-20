import type { Env } from "../../types";
import { signToken } from "../../utils/jwt";
import { verifyPassword } from "../../utils/password";
import { jsonError, jsonOk } from "../../middleware/auth";
import { rateLimitKey } from "./shared";

export async function handleLogin(request: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid request body.");
  }
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return jsonError(400, "Email and password are required.");
  }
  if (!rateLimitKey(request, "login", env)) {
    return jsonError(429, "Too many attempts. Please wait a moment.");
  }
  const user = await env.DB.prepare("SELECT id, email, name, passwordHash, role, isActive FROM users WHERE email = ?").bind(email).first<any>();
  if (!user || !user.isActive) {
    return jsonError(401, "Invalid email or password.");
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return jsonError(401, "Invalid email or password.");
  }
  if (user.role !== "admin") {
    return jsonError(403, "This account does not have admin access.");
  }
  await env.DB.prepare("UPDATE users SET lastLogin = datetime('now') WHERE id = ?").bind(user.id).run();
  const ttl = Number(env.TOKEN_TTL_SECONDS || 43200);
  const token = await signToken({ sub: user.id, email: user.email, name: user.name || "Admin", role: user.role }, env.JWT_SECRET, ttl, env.JWT_ISSUER || "velora-admin");
  const res = jsonOk({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, lastLogin: new Date().toISOString() } });
  res.headers.append("Set-Cookie", `velora_admin_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${ttl}`);
  return res;
}

export async function handleMe(request: Request, env: Env, adminId: string): Promise<Response> {
  const user = await env.DB.prepare("SELECT id, name, email, role, lastLogin, createdAt FROM users WHERE id = ? AND isActive = 1").bind(adminId).first<any>();
  if (!user) return jsonError(404, "Admin account not found.");
  return jsonOk({ user });
}
