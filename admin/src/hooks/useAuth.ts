import { useEffect, useState, useCallback } from "react";
import { api, getToken, clearToken } from "../lib/api";

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: "admin" | "user";
  lastLogin: string | null;
  createdAt?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ user: AuthUser }>("/api/admin/auth/me");
      setUser(res.user);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    window.location.href = "/admin/login";
  }, []);

  return { user, loading, refresh, logout };
}
