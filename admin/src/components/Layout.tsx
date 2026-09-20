import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ToastProvider } from "./Toast";
import { ConfirmProvider } from "./ConfirmDialog";

const NAV = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/cards", label: "Tarot Cards" },
  { to: "/admin/readings", label: "Readings" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/settings", label: "Settings" },
  { to: "/admin/audit-logs", label: "Audit Logs" },
];

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label || "Admin";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    });
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const sidebar = (
    <nav className="sidebar" aria-label="Admin navigation">
      <Link to="/admin" className="sidebar-brand">
        <span aria-hidden="true">✦</span> Velora Admin
      </Link>
      <ul className="sidebar-nav">
        {NAV.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <div className="sidebar-profile">
          <div className="avatar" aria-hidden="true">{(user?.name || user?.email || "A").charAt(0).toUpperCase()}</div>
          <div>
            <div className="profile-name">{user?.name || "Admin"}</div>
            <div className="profile-email">{user?.email}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm btn-block" onClick={logout}>Log out</button>
      </div>
    </nav>
  );

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="app-shell">
          <a href="#main-content" className="skip-link">Skip to content</a>
          <aside className="sidebar-desktop" aria-label="Admin navigation">{sidebar}</aside>
          {mobileOpen && (
            <>
              <div className="drawer-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />
              <aside className="sidebar-drawer" aria-label="Admin navigation">{sidebar}</aside>
            </>
          )}
          <div className="main-area">
            <header className="topbar">
              <button className="icon-btn mobile-only" onClick={() => setMobileOpen(true)} aria-label="Open navigation" aria-expanded={mobileOpen}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <h1 className="topbar-title">{title}</h1>
              <div className="topbar-spacer" />
              <button className="icon-btn" onClick={logout} aria-label="Log out">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
              </button>
            </header>
            <main id="main-content" className="main-content">
              <Outlet />
            </main>
          </div>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
