"use client";

import React from "react";

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
}

export function AdminDashboardClient({
  stats,
  forecast,
  products,
  recentTransactions,
}: AdminDashboardProps) {
  return (
    <main className="dashboard-main container">
      <section className="welcome-banner card mt-4">
        <h1>Admin Command Console</h1>
        <p className="text-muted">Monitor business KPIs, check real-time product demand forecasts, and audit transaction logs.</p>
      </section>

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
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        .stat-card.warning .stat-num {
          color: var(--warning);
        }

        /* Forecasting styling */
        .forecast-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .forecast-item {
          padding: 14px;
          border-bottom: 1px solid var(--border-light);
        }
        .forecast-item:last-child {
          border-bottom: none;
        }
        .forecast-item .product-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .forecast-item .emoji {
          font-size: 24px;
          background: var(--green-light);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .forecast-total {
          text-align: right;
        }
        .forecast-total .total-num {
          font-size: 20px;
          font-weight: 700;
          color: var(--green);
          display: block;
          line-height: 1.1;
        }
        .forecast-total .total-label {
          font-size: 10px;
          color: var(--muted);
        }
        .forecast-footer {
          background: var(--cream);
          padding: 10px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          text-align: center;
        }

        /* Catalog list styling */
        .products-grid-dashboard {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .product-item {
          padding: 12px 16px;
          flex-direction: row;
          background: var(--cream);
        }
        .prod-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .prod-left .emoji {
          font-size: 22px;
        }

        /* Transactions list styling */
        .transactions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 550px;
          overflow-y: auto;
        }
        .tx-item {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-light);
        }
        .tx-item:last-child {
          border-bottom: none;
        }
        .tx-info strong {
          font-size: 14px;
        }
        .tx-info .description {
          font-size: 12px;
          margin-top: 2px;
        }
        .tx-info .tx-time {
          font-size: 10px;
          margin-top: 2px;
        }
        .tx-amount {
          font-size: 15px;
          font-weight: 700;
          text-align: right;
        }
        .tx-amount.positive {
          color: var(--success);
        }
        .tx-amount.negative {
          color: var(--error);
        }
        .audit-trail {
          font-size: 9px;
          color: var(--muted);
          font-weight: 400;
          margin-top: 2px;
        }

        @media (max-width: 1000px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
