import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Dashboard as DashboardData } from "@shared/admin";
import { formatDateTime } from "@shared/admin";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<DashboardData>("/api/admin/dashboard")
      .then(setData)
      .catch(() => setError("Dashboard could not be loaded."));
  }, []);

  if (error) return <div className="alert alert-danger" role="alert">{error}</div>;
  if (!data) return <div className="stat-grid" aria-hidden="true">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="stat-card skeleton" />)}</div>;

  const stats = [
    { label: "Total Cards", value: data.totalCards },
    { label: "Active Cards", value: data.activeCards },
    { label: "Total Users", value: data.totalUsers },
    { label: "Total Readings", value: data.totalReadings },
    { label: "Today's Readings", value: data.todayReadings },
    { label: "This Month", value: data.monthReadings },
  ];

  return (
    <div>
      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value.toLocaleString()}</div>
          </div>
        ))}
      </div>
      {data.mostSelectedCard && (
        <p className="text-secondary">Most selected card: <strong>{data.mostSelectedCard}</strong></p>
      )}
      <section className="panel" style={{ marginTop: 24 }}>
        <h2 className="panel-title">Recent Readings</h2>
        {data.recentReadings.length === 0 ? (
          <p className="empty-state">No readings yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Reading</th><th>User</th><th>Type</th><th>Cards</th><th>Date</th></tr>
            </thead>
            <tbody>
              {data.recentReadings.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td>
                  <td>{r.userEmail || "—"}</td>
                  <td>{r.readingType}</td>
                  <td>{r.cardCount}</td>
                  <td>{formatDateTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
