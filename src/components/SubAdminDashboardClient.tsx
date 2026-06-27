"use client";

import React, { useState } from "react";
import { createRoute } from "@/app/actions";

interface CustomerItem {
  id: string;
  name: string;
  email: string;
  walletBalance: number;
  hasActiveSub: boolean;
  routeName: string;
}

interface ForecastItem {
  productName: string;
  emoji: string;
  size: string;
  totalQuantity: number;
}

interface RouteItem {
  id: string;
  name: string;
  description: string | null;
}

interface SubAdminDashboardProps {
  subAdminId: string;
  stats: {
    totalCustomers: number;
    totalRoutes: number;
    activeDeliveriesCount: number;
  };
  routes: RouteItem[];
  customers: CustomerItem[];
  forecast: ForecastItem[];
}

export function SubAdminDashboardClient({
  subAdminId,
  stats,
  routes,
  customers,
  forecast,
}: SubAdminDashboardProps) {
  const [routeName, setRouteName] = useState("");
  const [routeDesc, setRouteDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName.trim()) return;
    setCreating(true);
    setErrorMsg("");
    setSuccessMsg("");
    const res = await createRoute(routeName, routeDesc, subAdminId);
    setCreating(false);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to create route.");
    } else {
      setSuccessMsg(`Route "${routeName}" created and assigned to your franchise!`);
      setRouteName("");
      setRouteDesc("");
    }
  };

  return (
    <main className="dashboard-main container">
      <section className="welcome-banner card mt-4">
        <h1>Vendor Sub-Admin Panel</h1>
        <p className="text-muted">Manage your franchise branch, monitor logistics routes, track branch customers, and check localized demand forecasts.</p>
      </section>

      {errorMsg && <div className="badge badge-danger mt-4 block-alert">{errorMsg}</div>}
      {successMsg && <div className="badge badge-success mt-4 block-alert">{successMsg}</div>}

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
          <span className="stat-label">Active Subscriptions</span>
          <span className="stat-num">{stats.activeDeliveriesCount}</span>
        </div>
      </div>

      <div className="dashboard-grid mt-4">
        {/* LEFT COLUMN: CUSTOMERS LIST & DEMAND FORECAST */}
        <div className="grid-column">
          {/* Franchise Customer List */}
          <div className="card">
            <h3>Franchise Customers Sheet</h3>
            <p className="text-muted mb-4">Customers assigned to your territory's routes.</p>

            <div className="requests-table-wrapper">
              {customers.length === 0 ? (
                <p className="text-muted text-center py-8">No customers assigned to your routes yet.</p>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Route</th>
                      <th>Wallet Balance</th>
                      <th>Subscription</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.name}</strong>
                          <div className="text-muted" style={{ fontSize: "11px" }}>{c.email}</div>
                        </td>
                        <td style={{ fontSize: "13px" }}>📍 {c.routeName}</td>
                        <td>
                          <strong style={{ color: c.walletBalance < 50 ? "var(--error)" : "var(--green)" }}>
                            ₹{c.walletBalance.toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <span className={`badge badge-${c.hasActiveSub ? "success" : "warning"}`}>
                            {c.hasActiveSub ? "Active" : "No Subscription"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Localized Demand Forecast */}
          <div className="card mt-4">
            <h3>Branch Demand Forecast (Tomorrow's Run)</h3>
            <p className="text-muted mb-4">Aggregated product requirements calculated from your branch's active customer subscriptions.</p>

            <div className="forecast-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {forecast.length === 0 ? (
                <p className="text-muted text-center py-4">No active subscriptions to forecast demand.</p>
              ) : (
                forecast.map((item, idx) => (
                  <div key={idx} className="forecast-item flex-between p-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "24px" }}>{item.emoji}</span>
                      <div>
                        <strong>{item.productName}</strong>
                        <div className="text-muted" style={{ fontSize: "12px" }}>{item.size}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--green)" }}>{item.totalQuantity}</span>
                      <div className="text-muted" style={{ fontSize: "10px" }}>Units Needed</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ROUTES & CREATE ROUTE FORM */}
        <div className="grid-column">
          {/* Create Route Form */}
          <div className="card">
            <h3>Create Franchise Route</h3>
            <p className="text-muted mb-4">Add a new delivery route for your branch.</p>
            <form onSubmit={handleCreateRoute}>
              <div className="form-group mb-3">
                <label className="form-label">Route Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sub-Branch Route C"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Morning delivery sector 4 & 5"
                  value={routeDesc}
                  onChange={(e) => setRouteDesc(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={creating}>
                {creating ? "Creating..." : "+ Create Route"}
              </button>
            </form>
          </div>

          {/* Existing Routes List */}
          <div className="card mt-4">
            <h3>Your Branch Routes</h3>
            <p className="text-muted mb-4">Routes assigned to your vendor territory.</p>
            <div className="routes-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {routes.length === 0 ? (
                <p className="text-muted text-center py-4">No routes created for your branch yet.</p>
              ) : (
                routes.map((r) => (
                  <div key={r.id} className="route-item card p-3 flex-between" style={{ background: "var(--cream)", flexDirection: "row" }}>
                    <div>
                      <strong>📍 {r.name}</strong>
                      {r.description && <div className="text-muted mt-1" style={{ fontSize: "12px" }}>{r.description}</div>}
                    </div>
                    <span className="badge badge-info">Active</span>
                  </div>
                ))
              )}
            </div>
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
        .block-alert {
          display: block;
          text-align: center;
          padding: 10px;
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
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
        }
        .grid-column {
          display: flex;
          flex-direction: column;
        }
        .requests-table-wrapper {
          overflow-x: auto;
        }
        .dashboard-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 14px;
        }
        .dashboard-table th, .dashboard-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-light);
        }
        .dashboard-table th {
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
        }
        @media (max-width: 1000px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
