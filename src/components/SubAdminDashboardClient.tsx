"use client";

import React from "react";

interface SubAdminDashboardProps {
  stats: {
    totalCustomers: number;
    totalRoutes: number;
    activeDeliveriesCount: number;
  };
  routes: {
    id: string;
    name: string;
    description: string | null;
  }[];
}

export function SubAdminDashboardClient({ stats, routes }: SubAdminDashboardProps) {
  return (
    <main className="dashboard-main container">
      <section className="welcome-banner card mt-4">
        <h1>Vendor Sub-Admin Panel</h1>
        <p className="text-muted">Manage your franchise branch, monitor logistics routes, and review customer sheets.</p>
      </section>

      <div className="stats-grid mt-4">
        <div className="card stat-card">
          <span className="stat-label">Franchise Customers</span>
          <span className="stat-num">{stats.totalCustomers}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Assigned Routes</span>
          <span className="stat-num">{stats.totalRoutes}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Active Orders Scheduled</span>
          <span className="stat-num">{stats.activeDeliveriesCount}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card routes-card mt-4">
          <h3>Your Delivery Routes</h3>
          <p className="text-muted mb-4">Routes assigned to your vendor territory.</p>
          <div className="routes-list">
            {routes.length === 0 ? (
              <p className="text-muted text-center py-4">No routes assigned yet.</p>
            ) : (
              routes.map((r) => (
                <div key={r.id} className="route-item card p-4 mb-2 flex-between" style={{ background: "var(--cream)", flexDirection: "row" }}>
                  <div>
                    <strong>📍 {r.name}</strong>
                    {r.description && <div className="text-muted small mt-1">{r.description}</div>}
                  </div>
                  <span className="badge badge-info">Active</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-main {
          padding-top: 24px;
          padding-bottom: 80px;
        }
        .welcome-banner {
          background: linear-gradient(135deg, var(--white) 60%, var(--green-light) 100%);
          border-left: 5px solid var(--green);
        }
        .welcome-banner h1 {
          font-family: var(--font-display);
          font-size: 28px;
          color: var(--text);
          margin-bottom: 8px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .stat-card {
          text-align: center;
          padding: 20px;
        }
        .stat-card .stat-label {
          font-size: 11px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 6px;
        }
        .stat-card .stat-num {
          font-size: 28px;
          font-weight: 700;
          color: var(--green);
          display: block;
        }
        .dashboard-grid {
          margin-top: 24px;
        }
      `}</style>
    </main>
  );
}
