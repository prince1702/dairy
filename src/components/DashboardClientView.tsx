"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DashboardClientViewProps {
  customer: {
    id: string;
    name: string;
    email: string;
    address: string | null;
  };
  walletBalance: number;
  pendingRechargeCount: number;
  pendingRechargeSum: number;
  baselineItemsCount: number;
  subscriptionItems: {
    productId: string;
    quantity: number;
    productName: string;
    productEmoji: string;
    productSize: string;
  }[];
  tomorrowOverrides: {
    productId: string;
    quantity: number;
    productName: string;
    productEmoji: string;
  }[];
  isTomorrowPaused: boolean;
  isTomorrowOnVacation: boolean;
  monthlySpending: number;
  todayDeliveryStatus: string;
  activeProductsCount: number;
  notifications: {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    timestamp: Date;
  }[];
  deliveries: {
    id: string;
    deliveredAt: Date;
    itemsSnapshot: string;
    totalCost: number;
    status: string;
    issueNote: string | null;
  }[];
  products: {
    id: string;
    name: string;
    emoji: string;
    category: string;
    price: number;
    size: string;
  }[];
}

export function DashboardClientView({
  customer,
  walletBalance,
  pendingRechargeCount,
  pendingRechargeSum,
  baselineItemsCount,
  subscriptionItems,
  tomorrowOverrides,
  isTomorrowPaused,
  isTomorrowOnVacation,
  monthlySpending,
  todayDeliveryStatus,
  activeProductsCount,
  notifications,
  deliveries,
  products,
}: DashboardClientViewProps) {
  const router = useRouter();

  // Resolve tomorrow's delivery items list
  const getTomorrowItemsList = () => {
    if (isTomorrowPaused) return [];
    if (isTomorrowOnVacation) return [];

    const list: { name: string; emoji: string; qty: number }[] = [];
    products.forEach((p) => {
      const override = tomorrowOverrides.find((o) => o.productId === p.id);
      if (override !== undefined) {
        if (override.quantity > 0) {
          list.push({ name: p.name, emoji: p.emoji, qty: override.quantity });
        }
      } else {
        const baseline = subscriptionItems.find((s) => s.productId === p.id);
        if (baseline && baseline.quantity > 0) {
          list.push({ name: p.name, emoji: p.emoji, qty: baseline.quantity });
        }
      }
    });
    return list;
  };

  const tomorrowList = getTomorrowItemsList();

  return (
    <div className="dashboard-content">
      {/* Welcome Banner */}
      <section className="welcome-banner-card">
        <div className="banner-details">
          <h1>Hello, {customer.name}! 👋</h1>
          <p>Welcome back to Bhagwati Enterprise. Here is a summary of your daily dairy deliveries.</p>
          {customer.address && (
            <div className="delivery-address-info">
              <span className="info-icon">📍</span>
              <span><strong>Delivery Address:</strong> {customer.address}</span>
            </div>
          )}
        </div>
      </section>

      {/* Grid of 10 Dashboard Cards */}
      <div className="dashboard-grid">
        {/* 1. Wallet Balance */}
        <div className="db-card card-wallet">
          <div className="db-card-header">
            <span className="card-icon">💰</span>
            <h3>Wallet Balance</h3>
          </div>
          <div className="card-large-val">₹{walletBalance.toFixed(2)}</div>
          <p className="card-sub-text">
            {walletBalance < 150 ? (
              <span className="alert-low">⚠️ Low Balance! Recharge soon.</span>
            ) : (
              "Securely auto-deducted daily."
            )}
          </p>
          <Link href="/customer/recharge" className="card-link-btn">Recharge Wallet →</Link>
        </div>

        {/* 2. Tomorrow Delivery Summary */}
        <div className="db-card card-tomorrow">
          <div className="db-card-header">
            <span className="card-icon">🚚</span>
            <h3>Tomorrow's Delivery</h3>
          </div>
          {isTomorrowPaused ? (
            <div className="tomorrow-status paused">⏸️ Paused for Tomorrow</div>
          ) : isTomorrowOnVacation ? (
            <div className="tomorrow-status vacation">🌴 Pause (Vacation Mode)</div>
          ) : tomorrowList.length === 0 ? (
            <div className="tomorrow-status empty">No items scheduled</div>
          ) : (
            <div className="tomorrow-items-mini-list">
              {tomorrowList.slice(0, 3).map((item, idx) => (
                <div key={idx} className="mini-item">
                  <span>{item.emoji} {item.name}</span>
                  <strong>x{item.qty}</strong>
                </div>
              ))}
              {tomorrowList.length > 3 && <span className="more-items">+{tomorrowList.length - 3} more items</span>}
            </div>
          )}
          <Link href="/customer/tomorrow" className="card-link-btn">Modify Tomorrow →</Link>
        </div>

        {/* 3. Active Subscription */}
        <div className="db-card">
          <div className="db-card-header">
            <span className="card-icon">🥛</span>
            <h3>Active Subscription</h3>
          </div>
          <div className="card-large-val">{baselineItemsCount}</div>
          <p className="card-sub-text">Items in your daily baseline list.</p>
          <Link href="/customer/subscription" className="card-link-btn">Manage Baseline →</Link>
        </div>

        {/* 4. Monthly Spending */}
        <div className="db-card">
          <div className="db-card-header">
            <span className="card-icon">📈</span>
            <h3>Monthly Spending</h3>
          </div>
          <div className="card-large-val">₹{monthlySpending.toFixed(2)}</div>
          <p className="card-sub-text">Total spent in this calendar month.</p>
          <Link href="/customer/delivery" className="card-link-btn">View Deliveries →</Link>
        </div>

        {/* 5. Pending Recharge */}
        <div className="db-card">
          <div className="db-card-header">
            <span className="card-icon">💳</span>
            <h3>Pending Recharge</h3>
          </div>
          <div className="card-large-val">
            {pendingRechargeCount > 0 ? `₹${pendingRechargeSum.toFixed(2)}` : "None"}
          </div>
          <p className="card-sub-text">
            {pendingRechargeCount > 0
              ? `${pendingRechargeCount} recharge request pending approval.`
              : "No pending requests."}
          </p>
          <Link href="/customer/recharge" className="card-link-btn">Recharge History →</Link>
        </div>

        {/* 6. Recent Notifications */}
        <div className="db-card card-notifications">
          <div className="db-card-header">
            <span className="card-icon">🔔</span>
            <h3>Recent Alerts</h3>
          </div>
          <div className="notif-list-mini">
            {notifications.length === 0 ? (
              <p className="empty-text">No notifications yet.</p>
            ) : (
              notifications.slice(0, 2).map((notif) => (
                <div key={notif.id} className="notif-item-mini">
                  <strong>{notif.title}</strong>
                  <p>{notif.message}</p>
                </div>
              ))
            )}
          </div>
          <Link href="/customer/notifications" className="card-link-btn">All Notifications →</Link>
        </div>

        {/* 7. Delivery Status */}
        <div className="db-card">
          <div className="db-card-header">
            <span className="card-icon">✨</span>
            <h3>Today's Status</h3>
          </div>
          <div className="card-status-badge">{todayDeliveryStatus}</div>
          <p className="card-sub-text">Deliveries occur in the morning before 7:00 AM.</p>
          <Link href="/customer/delivery" className="card-link-btn">Delivery Details →</Link>
        </div>

        {/* 8. Active Products */}
        <div className="db-card">
          <div className="db-card-header">
            <span className="card-icon">📦</span>
            <h3>Available Products</h3>
          </div>
          <div className="card-large-val">{activeProductsCount}</div>
          <p className="card-sub-text">Fresh items currently available to order.</p>
          <Link href="/customer/subscription" className="card-link-btn">Browse Shop →</Link>
        </div>

        {/* 9. Upcoming Delivery */}
        <div className="db-card">
          <div className="db-card-header">
            <span className="card-icon">📅</span>
            <h3>Next Scheduled</h3>
          </div>
          <div className="next-sched-date">
            {isTomorrowPaused || isTomorrowOnVacation ? "Paused" : "Tomorrow Morning"}
          </div>
          <p className="card-sub-text">
            {isTomorrowPaused || isTomorrowOnVacation
              ? "Resumes once pause/vacation ends."
              : `Delivery estimated around 5:00 AM - 7:00 AM.`}
          </p>
          <Link href="/customer/tomorrow" className="card-link-btn">Manage Schedule →</Link>
        </div>

        {/* 10. Quick Statistics */}
        <div className="db-card card-stats">
          <div className="db-card-header">
            <span className="card-icon">📊</span>
            <h3>Quick Statistics</h3>
          </div>
          <div className="stats-box">
            <div className="stat-row">
              <span>Avg Daily Delivery Cost:</span>
              <strong>
                ₹{(subscriptionItems.reduce((sum, item) => {
                  const prod = products.find(p => p.id === item.productId);
                  return sum + (prod ? prod.price * item.quantity : 0);
                }, 0)).toFixed(2)}
              </strong>
            </div>
            <div className="stat-row">
              <span>Days of Balance Left:</span>
              <strong>
                {subscriptionItems.reduce((sum, item) => {
                  const prod = products.find(p => p.id === item.productId);
                  return sum + (prod ? prod.price * item.quantity : 0);
                }, 0) > 0 ? (
                  Math.floor(walletBalance / subscriptionItems.reduce((sum, item) => {
                    const prod = products.find(p => p.id === item.productId);
                    return sum + (prod ? prod.price * item.quantity : 0);
                  }, 0)) + " Days"
                ) : (
                  "N/A"
                )}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons Section */}
      <section className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <button className="qa-btn" onClick={() => router.push("/customer/subscription")}>
            <span className="qa-icon">🥛</span>
            Manage Subscription
          </button>
          <button className="qa-btn" onClick={() => router.push("/customer/tomorrow")}>
            <span className="qa-icon">📅</span>
            Tomorrow Changes
          </button>
          <button className="qa-btn" onClick={() => router.push("/customer/recharge")}>
            <span className="qa-icon">💳</span>
            Recharge Wallet
          </button>
          <button className="qa-btn" onClick={() => router.push("/customer/vacation")}>
            <span className="qa-icon">🌴</span>
            Vacation Mode
          </button>
          <button className="qa-btn" onClick={() => router.push("/customer/pause")}>
            <span className="qa-icon">⏸</span>
            Pause Delivery
          </button>
        </div>
      </section>

      {/* Local Styles */}
      <style jsx>{`
        .dashboard-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* Banner styling */
        .welcome-banner-card {
          background: linear-gradient(135deg, var(--primary-color) 0%, rgba(16, 185, 129, 0.75) 100%);
          color: white;
          padding: 32px;
          border-radius: var(--radius, 12px);
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15);
        }

        .welcome-banner-card h1 {
          font-family: var(--font-display, 'Playfair Display', serif);
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .welcome-banner-card p {
          opacity: 0.95;
          font-size: 15px;
        }

        .delivery-address-info {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
          background: rgba(255, 255, 255, 0.15);
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          width: fit-content;
        }

        /* Card grid styling */
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        .db-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius, 12px);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 4px 6px var(--shadow-color);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
        }

        .db-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px var(--shadow-color);
        }

        .db-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .card-icon {
          font-size: 20px;
        }

        .db-card-header h3 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-large-val {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-main);
          margin-top: 4px;
        }

        .card-sub-text {
          font-size: 13px;
          color: var(--text-muted);
        }

        .alert-low {
          color: #EF4444;
          font-weight: 600;
        }

        .card-link-btn {
          font-size: 13px;
          font-weight: 600;
          color: var(--primary-color);
          text-decoration: none;
          margin-top: auto;
          align-self: flex-start;
          transition: transform 0.2s;
        }

        .card-link-btn:hover {
          transform: translateX(3px);
        }

        /* Card Wallet Specific styles */
        .card-wallet {
          border-left: 4px solid var(--primary-color);
        }

        /* Card Tomorrow Specific styles */
        .card-tomorrow {
          border-left: 4px solid var(--accent-color);
        }

        .tomorrow-status {
          font-size: 14px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 8px;
          margin-top: 8px;
        }

        .tomorrow-status.paused {
          background: var(--danger-light);
          color: var(--danger-color);
        }

        .tomorrow-status.vacation {
          background: var(--primary-light);
          color: var(--primary-color);
        }

        .tomorrow-status.empty {
          background: var(--border-light);
          color: var(--text-muted);
        }

        .tomorrow-items-mini-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 8px;
        }

        .mini-item {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .more-items {
          font-size: 11px;
          color: var(--text-muted);
          font-style: italic;
          margin-top: 2px;
        }

        /* Card Status Specific styles */
        .card-status-badge {
          display: inline-block;
          font-size: 16px;
          font-weight: 700;
          color: var(--primary-color);
          background: var(--primary-light);
          padding: 6px 12px;
          border-radius: 20px;
          width: fit-content;
          margin-top: 8px;
        }

        /* Notifications Mini-list */
        .notif-list-mini {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }

        .notif-item-mini {
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 8px;
        }

        .notif-item-mini:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .notif-item-mini strong {
          font-size: 12px;
          color: var(--text-main);
        }

        .notif-item-mini p {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .empty-text {
          font-size: 12px;
          color: var(--text-muted);
          font-style: italic;
        }

        /* Next Scheduled styling */
        .next-sched-date {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-main);
          margin-top: 8px;
        }

        /* Quick Statistics Box */
        .stats-box {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          border-bottom: 1px dashed var(--border-light);
          padding-bottom: 6px;
        }

        .stat-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .stat-row span {
          color: var(--text-muted);
        }

        /* Quick Actions styling */
        .quick-actions-section h2 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--text-main);
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }

        .qa-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-main);
          box-shadow: 0 4px 6px var(--shadow-color);
          transition: all 0.2s ease;
        }

        .qa-btn:hover {
          transform: translateY(-2px);
          border-color: var(--primary-color);
          box-shadow: 0 6px 12px var(--shadow-color);
          background: var(--primary-light);
          color: var(--primary-color);
        }

        .qa-icon {
          font-size: 28px;
        }

        @media (max-width: 600px) {
          .quick-actions-grid {
            grid-template-columns: 1fr 1fr;
          }
          .qa-btn {
            padding: 16px 10px;
            font-size: 13px;
          }
          .qa-icon {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
}
