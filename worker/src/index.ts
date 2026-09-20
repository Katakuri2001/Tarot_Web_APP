import type { Env } from "./types";
import { requireAdmin, jsonError, jsonOk } from "./middleware/auth";
import { handleLogin, handleMe } from "./routes/admin/auth";
import { handleCardsList, handleCardGet, handleCardCreate, handleCardUpdate, handleCardImage, handleCardStatus } from "./routes/admin/cards";
import { handleReadingsList, handleReadingGet } from "./routes/admin/readings";
import { handleUsersList, handleUserGet, handleUserStatus } from "./routes/admin/users";
import { handleDashboard } from "./routes/admin/dashboard";
import { handleAnalytics } from "./routes/admin/analytics";
import { handleSettingsGet, handleSettingsUpdate } from "./routes/admin/settings";
import { handleAuditList } from "./routes/admin/audit";
import { logAudit } from "./services/audit";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": url.origin, "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400" } });
    }

    try {
      if (!env.JWT_SECRET) return jsonError(500, "Server configuration error.");

      if (pathname === "/api/admin/auth/login" && request.method === "POST") {
        return await handleLogin(request, env);
      }

      const auth = await requireAdmin(request, env);
      if ("response" in auth) return auth.response;
      const admin = auth.payload;

      // Audit write helper bound to this admin
      const audit = (action: string, entityType: string, entityId: string | null, metadata?: unknown) =>
        logAudit(env, admin.sub, admin.name, action, entityType, entityId, metadata);

      if (pathname === "/api/admin/auth/me" && request.method === "GET") {
        return await handleMe(request, env, admin.sub);
      }

      if (pathname === "/api/admin/dashboard" && request.method === "GET") {
        return await handleDashboard(env);
      }

      if (pathname === "/api/admin/analytics" && request.method === "GET") {
        return await handleAnalytics(env, url);
      }

      if (pathname === "/api/admin/cards" && request.method === "GET") {
        return await handleCardsList(env, url);
      }
      if (pathname === "/api/admin/cards" && request.method === "POST") {
        return await handleCardCreate(request, env, audit);
      }

      const cardMatch = pathname.match(/^\/api\/admin\/cards\/([^/]+)$/);
      if (cardMatch) {
        const id = decodeURIComponent(cardMatch[1]);
        if (request.method === "GET") return await handleCardGet(env, id);
        if (request.method === "PUT") return await handleCardUpdate(request, env, id, audit);
      }

      const cardImageMatch = pathname.match(/^\/api\/admin\/cards\/([^/]+)\/image$/);
      if (cardImageMatch && request.method === "POST") {
        return await handleCardImage(request, env, decodeURIComponent(cardImageMatch[1]), audit);
      }

      const cardStatusMatch = pathname.match(/^\/api\/admin\/cards\/([^/]+)\/status$/);
      if (cardStatusMatch && request.method === "PUT") {
        return await handleCardStatus(request, env, decodeURIComponent(cardStatusMatch[1]), audit);
      }

      if (pathname === "/api/admin/readings" && request.method === "GET") {
        return await handleReadingsList(env, url);
      }

      const readingMatch = pathname.match(/^\/api\/admin\/readings\/([^/]+)$/);
      if (readingMatch && request.method === "GET") {
        return await handleReadingGet(env, decodeURIComponent(readingMatch[1]));
      }

      if (pathname === "/api/admin/users" && request.method === "GET") {
        return await handleUsersList(env, url);
      }

      const userMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
      if (userMatch) {
        const id = decodeURIComponent(userMatch[1]);
        if (request.method === "GET") return await handleUserGet(env, id);
        if (request.method === "PUT") return await handleUserStatus(request, env, id, admin, audit);
      }

      if (pathname === "/api/admin/settings") {
        if (request.method === "GET") return await handleSettingsGet(env);
        if (request.method === "PUT") return await handleSettingsUpdate(request, env, audit);
      }

      if (pathname === "/api/admin/audit-logs" && request.method === "GET") {
        return await handleAuditList(env, url);
      }

      if (pathname.startsWith("/api/admin/")) {
        return jsonError(404, "Endpoint not found.");
      }

      return jsonError(404, "Not found.");
    } catch (err) {
      console.error("Worker error:", err instanceof Error ? err.message : String(err));
      return jsonError(500, "An unexpected error occurred.");
    }
  },
} satisfies ExportedHandler<Env>;
