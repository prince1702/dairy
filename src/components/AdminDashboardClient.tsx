"use client";

import React, { useState } from "react";
import { createStaffUser, toggleUserStatus } from "@/app/actions";

interface Product {
  id: string;
  name: string;
  emoji: string;
  category: string;
  price: number;
  size: string;
  available: boolean;
}

interface ForecastItem {
  productName: string;
  emoji: string;
  size: string;
  totalQuantity: number;
}

interface TransactionItem {
  id: string;
  wallet: {
    user: {
      name: string;
    };
  };
  beforeBalance: number;
  afterBalance: number;
  changeAmount: number;
  source: string;
  description: string | null;
  timestamp: Date;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phone: string | null;
  createdAt: Date;
}

interface AdminDashboardProps {
  stats: {
    totalCustomers: number;
    totalWalletBalance: number;
    pendingRechargesCount: number;
    activeSubscriptionsCount: number;
  };
  forecast: ForecastItem[];
  products: Product[];
  recentTransactions: TransactionItem[];
  allUsers: UserItem[];
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  SUB_ADMIN: "Sub Admin",
  MANAGER: "Manager",
  DELIVERY_PERSON: "Delivery Person",
  CUSTOMER: "Customer",
};

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "badge-danger",
  SUB_ADMIN: "badge-warning",
  MANAGER: "badge-info",
  DELIVERY_PERSON: "badge-info",
  CUSTOMER: "badge-success",
};

export function AdminDashboardClient({
  stats,
  forecast,
  products,
  recentTransactions,
  allUsers,
}: AdminDashboardProps) {
  // User Management state
  const [activeTab, setActiveTab] = useState<"dashboard" | "users">("dashboard");
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("MANAGER");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState("");

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setCreating(true);
    const res = await createStaffUser(formName, formEmail, formPassword, formRole, formPhone);
    setCreating(false);
    if (!res.success) {
      setFormError(res.error || "Failed to create user.");
    } else {
      setFormSuccess("User created successfully! Refresh to see updated list.");
      setFormName(""); setFormEmail(""); setFormPassword(""); setFormPhone(""); setFormRole("MANAGER");
    }
  };

  const handleToggle = async (userId: string) => {
    setTogglingId(userId);
    setToggleError("");
    const res = await toggleUserStatus(userId);
    setTogglingId(null);
    if (!res.success) {
      setToggleError(res.error || "Failed to update user status.");
    }
  };

  return (
    <main className="dashboard-main container">
      <section className="welcome-banner card mt-4">
        <h1>Admin Command Console</h1>
        <p className="text-muted">Monitor business KPIs, check real-time product demand forecasts, audit transaction logs, and manage all user accounts.</p>
      </section>

      {/* Tab Switcher */}
      <div className="tab-bar mt-4">
        <button
          className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 User Management
          <span className="tab-count">{allUsers.length}</span>
        </button>
      </div>

      {/* ─── DASHBOARD TAB ─── */}
      {activeTab === "dashboard" && (
        <>
          {/* KPI Stats Cards */}
          <div className="stats-grid mt-4">
            <div className="card stat-card">
              <span className="stat-label">Total Customers</span>
              <span className="stat-num">{stats.totalCustomers}</span>
            </div>
            <div className="card stat-card">
              <span className="stat-label">Active Subscriptions</span>
              <span className="stat-num">{stats.activeSubscriptionsCount}</span>
            </div>
            <div className="card stat-card">
              <span className="stat-label">Prepaid Assets (Wallets)</span>
              <span className="stat-num">₹{stats.totalWalletBalance.toFixed(2)}</span>
            </div>
            <div className="card stat-card warning">
              <span className="stat-label">Pending Recharges</span>
              <span className="stat-num">{stats.pendingRechargesCount}</span>
            </div>
          </div>

          <div className="dashboard-grid">
            {/* LEFT COLUMN: DEMAND FORECASTING */}
            <div className="grid-column">
              <div className="card forecast-card">
                <div className="flex-between mb-4">
                  <div>
                    <h3>Daily Demand Forecasting</h3>
                    <p className="text-muted">Aggregated product requirements calculated from active client subscriptions for tomorrow.</p>
                  </div>
                  <span className="badge badge-info">Tomorrow's Run</span>
                </div>

                <div className="forecast-list">
                  {forecast.length === 0 ? (
                    <p className="text-muted text-center py-8">No active subscriptions to forecast demand.</p>
                  ) : (
                    forecast.map((item, idx) => (
                      <div key={idx} className="forecast-item flex-between">
                        <div className="product-info">
                          <span className="emoji">{item.emoji}</span>
                          <div>
                            <strong>{item.productName}</strong>
                            <div className="size text-muted">{item.size}</div>
                          </div>
                        </div>
                        <div className="forecast-total">
                          <span className="total-num">{item.totalQuantity}</span>
                          <span className="total-label">Packets / Units</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="forecast-footer mt-4">
                  💡 <em>Dairy production planning can be prepared accordingly to reduce waste and prevent stockouts.</em>
                </div>
              </div>

              {/* GLOBAL PRODUCT CATALOG */}
              <div className="card catalog-card mt-4">
                <h3>Global Product Catalog</h3>
                <p className="text-muted mb-4">Current items available for customer subscription.</p>

                <div className="products-grid-dashboard">
                  {products.map((p) => (
                    <div key={p.id} className="product-item card flex-between">
                      <div className="prod-left">
                        <span className="emoji">{p.emoji}</span>
                        <div>
                          <strong>{p.name}</strong>
                          <div className="text-muted" style={{ fontSize: "12px" }}>
                            {p.size} • ₹{p.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className={`badge badge-${p.available ? "success" : "danger"}`}>
                          {p.available ? "Active" : "Out of Stock"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: RECENT TRANSACTIONS AUDIT TRAIL */}
            <div className="grid-column">
              <div className="card audit-card">
                <h3>System-Wide Audited Transactions</h3>
                <p className="text-muted mb-4">Live feed of all wallet recharges and delivery deductions.</p>

                <div className="transactions-list">
                  {recentTransactions.length === 0 ? (
                    <p className="text-muted text-center py-4">No transactions recorded.</p>
                  ) : (
                    recentTransactions.map((tx) => (
                      <div key={tx.id} className="tx-item flex-between">
                        <div className="tx-info">
                          <strong>{tx.wallet.user.name}</strong>
                          <div className="description text-muted">{tx.description || tx.source}</div>
                          <div className="tx-time text-muted">
                            {new Date(tx.timestamp).toLocaleDateString()} at{" "}
                            {new Date(tx.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        <div className={`tx-amount ${tx.changeAmount > 0 ? "positive" : "negative"}`}>
                          {tx.changeAmount > 0 ? "+" : ""}₹{tx.changeAmount.toFixed(2)}
                          <div className="audit-trail">
                            Bal: ₹{tx.beforeBalance.toFixed(2)} → ₹{tx.afterBalance.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── USER MANAGEMENT TAB ─── */}
      {activeTab === "users" && (
        <div className="mt-4">
          {toggleError && <div className="alert-error mb-4">{toggleError}</div>}

          <div className="card um-card">
            <div className="flex-between mb-4">
              <div>
                <h3>User Management</h3>
                <p className="text-muted">Manage all user accounts. Deactivating a user blocks their login immediately.</p>
              </div>
              <button className="btn btn-primary" onClick={() => { setShowModal(true); setFormError(""); setFormSuccess(""); }}>
                + Add Staff User
              </button>
            </div>

            <div className="um-table-wrap">
              <table className="um-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <span className="user-name">{user.name}</span>
                        {user.phone && <div className="user-phone text-muted">{user.phone}</div>}
                      </td>
                      <td className="text-muted">{user.email}</td>
                      <td>
                        <span className={`badge ${ROLE_BADGE[user.role] || "badge-info"}`}>
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.status === "ACTIVE" ? "badge-success" : "badge-danger"}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="text-muted" style={{ fontSize: "12px" }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        {user.role !== "ADMIN" ? (
                          <button
                            className={`toggle-btn ${user.status === "ACTIVE" ? "deactivate" : "activate"}`}
                            onClick={() => handleToggle(user.id)}
                            disabled={togglingId === user.id}
                          >
                            {togglingId === user.id
                              ? "..."
                              : user.status === "ACTIVE"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        ) : (
                          <span className="text-muted" style={{ fontSize: "12px" }}>Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE STAFF MODAL ─── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Staff User</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {formError && <div className="alert-error">{formError}</div>}
            {formSuccess && <div className="alert-success">{formSuccess}</div>}

            <form onSubmit={handleCreateStaff}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Kumar"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. ramesh@bhagwati.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  required
                >
                  <option value="MANAGER">Manager</option>
                  <option value="DELIVERY_PERSON">Delivery Person</option>
                  <option value="SUB_ADMIN">Sub Admin (Vendor)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min 8 characters"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

        /* Tab bar */
        .tab-bar {
          display: flex;
          gap: 4px;
          border-bottom: 2px solid var(--border);
          padding-bottom: 0;
        }
        .tab-btn {
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          color: var(--muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: color 0.2s, border-color 0.2s;
        }
        .tab-btn.active {
          color: var(--green);
          border-bottom-color: var(--green);
        }
        .tab-count {
          background: var(--green-light);
          color: var(--green);
          border-radius: 20px;
          font-size: 11px;
          padding: 1px 8px;
          font-weight: 700;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
          margin-top: 24px;
        }
        .grid-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* KPI cards stats grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .stat-card { text-align: center; padding: 20px; }
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
        .stat-card.warning .stat-num { color: var(--warning); }

        /* Forecasting */
        .forecast-list { display: flex; flex-direction: column; gap: 12px; }
        .forecast-item { padding: 14px; border-bottom: 1px solid var(--border-light); }
        .forecast-item:last-child { border-bottom: none; }
        .forecast-item .product-info { display: flex; align-items: center; gap: 12px; }
        .forecast-item .emoji {
          font-size: 24px; background: var(--green-light);
          width: 40px; height: 40px; display: flex;
          align-items: center; justify-content: center; border-radius: 50%;
        }
        .forecast-total { text-align: right; }
        .forecast-total .total-num { font-size: 20px; font-weight: 700; color: var(--green); display: block; line-height: 1.1; }
        .forecast-total .total-label { font-size: 10px; color: var(--muted); }
        .forecast-footer { background: var(--cream); padding: 10px; border-radius: var(--radius-sm); font-size: 12px; text-align: center; }

        /* Catalog */
        .products-grid-dashboard { display: flex; flex-direction: column; gap: 10px; }
        .product-item { padding: 12px 16px; flex-direction: row; background: var(--cream); }
        .prod-left { display: flex; align-items: center; gap: 12px; }
        .prod-left .emoji { font-size: 22px; }

        /* Transactions */
        .transactions-list { display: flex; flex-direction: column; gap: 12px; max-height: 550px; overflow-y: auto; }
        .tx-item { padding: 12px 16px; border-bottom: 1px solid var(--border-light); }
        .tx-item:last-child { border-bottom: none; }
        .tx-info strong { font-size: 14px; }
        .tx-info .description { font-size: 12px; margin-top: 2px; }
        .tx-info .tx-time { font-size: 10px; margin-top: 2px; }
        .tx-amount { font-size: 15px; font-weight: 700; text-align: right; }
        .tx-amount.positive { color: var(--success); }
        .tx-amount.negative { color: var(--error); }
        .audit-trail { font-size: 9px; color: var(--muted); font-weight: 400; margin-top: 2px; }

        /* ── User Management ── */
        .um-card { overflow: hidden; }
        .um-table-wrap { overflow-x: auto; }
        .um-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .um-table th {
          text-align: left;
          padding: 10px 14px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted);
          border-bottom: 2px solid var(--border);
          white-space: nowrap;
        }
        .um-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-light);
          vertical-align: middle;
        }
        .um-table tr:last-child td { border-bottom: none; }
        .um-table tr:hover td { background: var(--cream); }
        .user-name { font-weight: 600; color: var(--text); }
        .user-phone { font-size: 11px; margin-top: 2px; }
        .toggle-btn {
          padding: 5px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: opacity 0.15s;
        }
        .toggle-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .toggle-btn.deactivate { background: #fee2e2; color: #b91c1c; }
        .toggle-btn.deactivate:hover { background: #fca5a5; }
        .toggle-btn.activate { background: #dcfce7; color: #166534; }
        .toggle-btn.activate:hover { background: #86efac; }

        /* Alerts */
        .alert-error {
          background: #fee2e2; border: 1px solid #fca5a5;
          color: #b91c1c; padding: 10px 14px;
          border-radius: var(--radius-sm); font-size: 13px; font-weight: 500;
        }
        .alert-success {
          background: #dcfce7; border: 1px solid #86efac;
          color: #166534; padding: 10px 14px;
          border-radius: var(--radius-sm); font-size: 13px; font-weight: 500;
          margin-bottom: 12px;
        }

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          z-index: 999; padding: 20px;
        }
        .modal-card {
          background: var(--white);
          border-radius: var(--radius);
          padding: 32px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.2);
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .modal-header h3 {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
        }
        .modal-close {
          background: none; border: none;
          font-size: 18px; cursor: pointer;
          color: var(--muted); width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .modal-close:hover { background: var(--cream); }
        .modal-actions {
          display: flex; gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .btn-outline {
          background: none;
          border: 1px solid var(--border);
          color: var(--text);
          padding: 9px 20px;
          border-radius: var(--radius-sm);
          font-size: 14px; font-weight: 600; cursor: pointer;
        }
        .btn-outline:hover { background: var(--cream); }

        @media (max-width: 1000px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .dashboard-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}
