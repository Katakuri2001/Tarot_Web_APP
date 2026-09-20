import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { Layout } from "./components/Layout";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="app-loading" aria-live="polite">Loading…</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/admin/login" element={<Navigate to="/admin" replace />} />
      <Route element={<Layout />}>
        <Route path="/admin" element={<Dashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
