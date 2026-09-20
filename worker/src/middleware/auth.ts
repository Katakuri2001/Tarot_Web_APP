import type { Env, JWTPayload } from "../types";
export function getAuthToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7);
  const cookie = request.headers.get("Cookie");
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)velora_admin_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

export function jsonError(status: number, error: string, fields?: Record<string, string>): Response {
  return new Response(JSON.stringify(fields ? { error, fields } : { error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function jsonOk(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function corsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

export async function requireAdmin(request: Request, env: Env): Promise<{ payload: JWTPayload } | { response: Response }> {
  const token = getAuthToken(request);
  if (!token) {
    return { response: jsonError(401, "Authentication required.") };
  }
  const issuer = env.JWT_ISSUER || "velora-admin";
  const { verifyToken } = await import("../utils/jwt");
  const payload = await verifyToken(token, env.JWT_SECRET, issuer);
  if (!payload) {
    return { response: jsonError(401, "Session is invalid or has expired.") };
  }
  return { payload };
}
