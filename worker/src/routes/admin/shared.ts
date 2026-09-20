import type { Env } from "../../types";
import { clientKey, rateLimit } from "../../middleware/rateLimit";

export function rateLimitKey(request: Request, scope: string, env: Env): boolean {
  const limits: Record<string, [number, number]> = {
    login: [10, 5 * 60 * 1000],
    upload: [30, 60 * 1000],
  };
  const [limit, window] = limits[scope] || [100, 60 * 1000];
  void env;
  return rateLimit(clientKey(request, scope), limit, window);
}
