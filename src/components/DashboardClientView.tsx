"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  emoji: string;
  category: string;
  price: number;
  size: string;
}

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
  products: Product[];
  // Phase 2 Props
  totalDeliveriesCount: number;
  upcomingVacation: { startDate: string; endDate: string } | null;
  unreadNotificationsCount: number;
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
  // Phase 2 defaults
  totalDeliveriesCount = 0,
  upcomingVacation = null,
  unreadNotificationsCount = 0,
}: DashboardClientViewProps) {
  const router = useRouter();

  // Resolve tomorrow's delivery items list
  const getTomorrowItemsList = () => {
    if (isTomorrowPaused || isTomorrowOnVacation) return [];

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

  const quickActions = [
    {
      title: "Manage Subscription",
      description: "Edit recurring baseline schedule",
      path: "/customer/subscription",
      icon: "🥛",
    },
    {
      title: "Tomorrow Changes",
      description: "One-day overrides & overrides preview",
      path: "/customer/tomorrow",
      icon: "📅",
    },
    {
      title: "Recharge Wallet",
      description: "Top up wallet balance with receipt",
      path: "/customer/recharge",
      icon: "💳",
    },
    {
      title: "Pause Tomorrow",
      description: "Quick toggle tomorrow delivery skip",
      path: "/customer/pause",
      icon: "⏸️",
    },
    {
      title: "Vacation Mode",
      description: "Pause deliveries for date ranges",
      path: "/customer/vacation",
      icon: "🌴",
    },
    {
      title: "Order History",
      description: "Timeline view and orders catalog",
      path: "/customer/orders",
      icon: "📦",
    },
    {
      title: "Delivery History",
      description: "Track morning silent deliveries list",
      path: "/customer/delivery",
      icon: "🚚",
    },
    {
      title: "My Profile",
      description: "Personal settings & password security",
      path: "/customer/profile",
      icon: "👤",
    },
  ];

  return (
    <div className="dashboard-wrapper">
      {/* Welcome message banner */}
      <section className="welcome-banner">
        <h1>Welcome Back, {customer.name}! 👋</h1>
        <p className="banner-sub">Here is your Bhagwati Enterprise dashboard overview. Select a quick action below to manage your schedules.</p>
        {customer.address && (
          <div className="address-meta">
            <span>📍 <strong>Delivery Address:</strong> {customer.address}</span>
          </div>
        )}
      </section>

      {/* 8 Premium Overview Cards Grid */}
      <section className="overview-cards-section">
        <h2>Overview Summary</h2>
        <div className="cards-grid">
          {/* Card 1: Wallet Balance */}
          <div className="overview-card wallet-card-gradient">
            <div className="card-top-row">
              <span className="card-icon">💰</span>
              <h3>Wallet Balance</h3>
            </div>
            <div className="card-main-value">₹{walletBalance.toFixed(2)}</div>
            <p className="card-desc">
              {walletBalance < 150 ? "⚠️ Low balance! Recharge soon." : "Auto-deducted daily after delivery."}
            </p>
            <div className="card-accent-line green"></div>
          </div>

          {/* Card 2: Tomorrow Delivery */}
          <div className="overview-card tomorrow-card-gradient">
            <div className="card-top-row">
              <span className="card-icon">🚚</span>
              <h3>Tomorrow Delivery</h3>
            </div>
            {isTomorrowPaused ? (
              <div className="card-main-value text-small-val">⏸️ Paused (Daily)</div>
            ) : isTomorrowOnVacation ? (
              <div className="card-main-value text-small-val">🌴 Paused (Vacation)</div>
            ) : tomorrowList.length === 0 ? (
              <div className="card-main-value text-small-val">No delivery</div>
            ) : (
              <div className="card-main-value">{tomorrowList.length} items</div>
            )}
            <p className="card-desc">Scheduled for tomorrow morning.</p>
            <div className="card-accent-line amber"></div>
          </div>

          {/* Card 3: Active Subscription */}
          <div className="overview-card active-sub-gradient">
            <div className="card-top-row">
              <span className="card-icon">🥛</span>
              <h3>Active Subscription</h3>
            </div>
            <div className="card-main-value">{baselineItemsCount} items</div>
            <p className="card-desc">Baseline products delivered daily.</p>
            <div className="card-accent-line purple"></div>
          </div>

          {/* Card 4: Pending Recharge */}
          <div className="overview-card pending-recharge-gradient">
            <div className="card-top-row">
              <span className="card-icon">💳</span>
              <h3>Pending Recharge</h3>
            </div>
            <div className="card-main-value">
              {pendingRechargeCount > 0 ? `₹${pendingRechargeSum.toFixed(0)}` : "None"}
            </div>
            <p className="card-desc">
              {pendingRechargeCount > 0 ? `${pendingRechargeCount} top-ups pending review` : "All top-up receipts approved."}
            </p>
            <div className="card-accent-line yellow"></div>
          </div>

          {/* Card 5: Monthly Spending */}
          <div className="overview-card monthly-spending-gradient">
            <div className="card-top-row">
              <span className="card-icon">📈</span>
              <h3>Monthly Spending</h3>
            </div>
            <div className="card-main-value">₹{monthlySpending.toFixed(2)}</div>
            <p className="card-desc">Total spending in current month.</p>
            <div className="card-accent-line blue"></div>
          </div>

          {/* Card 6: Total Deliveries */}
          <div className="overview-card total-deliveries-gradient">
            <div className="card-top-row">
              <span className="card-icon">📦</span>
              <h3>Total Deliveries</h3>
            </div>
            <div className="card-main-value">{totalDeliveriesCount} logs</div>
            <p className="card-desc">Lifetime completed morning deliveries.</p>
            <div className="card-accent-line indigo"></div>
          </div>

          {/* Card 7: Upcoming Vacation */}
          <div className="overview-card upcoming-vacation-gradient">
            <div className="card-top-row">
              <span className="card-icon">🌴</span>
              <h3>Upcoming Vacation</h3>
            </div>
            {upcomingVacation ? (
              <div className="card-main-value text-small-val">
                {new Date(upcomingVacation.startDate).toLocaleDateString([], {month:'short', day:'numeric'})}
              </div>
            ) : (
              <div className="card-main-value text-small-val">No plans</div>
            )}
            <p className="card-desc">Next scheduled vacation ranges.</p>
            <div className="card-accent-line teal"></div>
          </div>

          {/* Card 8: Notifications Count */}
          <div className="overview-card notifications-count-gradient">
            <div className="card-top-row">
              <span className="card-icon">🔔</span>
              <h3>Unread Alerts</h3>
            </div>
            <div className="card-main-value">{unreadNotificationsCount} unread</div>
            <p className="card-desc">Unread alerts requiring attention.</p>
            <div className="card-accent-line red"></div>
          </div>
        </div>
      </section>

      {/* 8 Clickable Quick Action cards */}
      <section className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              className="action-card-btn"
              onClick={() => router.push(action.path)}
              aria-label={action.title}
            >
              <span className="action-emoji">{action.icon}</span>
              <div className="action-details">
                <span className="action-title">{action.title}</span>
                <span className="action-desc text-muted">{action.description}</span>
              </div>
              <span className="action-arrow">→</span>
            </button>
          ))}
        </div>
      </section>

      <style jsx>{`
        .dashboard-wrapper {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* Banner styling */
        .welcome-banner {
          background: linear-gradient(135deg, var(--primary-color) 0%, rgba(16, 185, 129, 0.8) 100%);
          color: white;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 4px 20px var(--shadow-color);
        }

        .welcome-banner h1 {
          font-family: var(--font-display, serif);
          font-size: 28px;
          font-weight: 700;
        }

        .banner-sub {
          opacity: 0.95;
          margin-top: 4px;
          font-size: 15px;
        }

        .address-meta {
          margin-top: 16px;
          background: rgba(255, 255, 255, 0.15);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          width: fit-content;
        }

        /* Summary section */
        .overview-cards-section h2, .quick-actions-section h2 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 16px;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }

        .overview-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          padding: 20px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 4px 6px var(--shadow-color);
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .overview-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px var(--shadow-color);
        }

        .card-top-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .card-icon {
          font-size: 18px;
        }

        .card-top-row h3 {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-main-value {
          font-size: 26px;
          font-weight: 700;
          color: var(--text-main);
          margin-top: 2px;
        }

        .card-main-value.text-small-val {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-main);
        }

        .card-desc {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: auto;
          line-height: 1.4;
        }

        /* Color accent lines */
        .card-accent-line {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 4px;
        }

        .card-accent-line.green { background: var(--primary-color); }
        .card-accent-line.amber { background: var(--accent-color); }
        .card-accent-line.purple { background: #8B5CF6; }
        .card-accent-line.yellow { background: #FBBF24; }
        .card-accent-line.blue { background: #3B82F6; }
        .card-accent-line.indigo { background: #6366F1; }
        .card-accent-line.teal { background: #14B8A6; }
        .card-accent-line.red { background: var(--danger-color); }

        /* Quick actions section styling */
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }

        .action-card-btn {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          cursor: pointer;
          text-align: left;
          width: 100%;
          box-shadow: 0 4px 6px var(--shadow-color);
          transition: all 0.2s ease;
          position: relative;
        }

        .action-card-btn:hover {
          transform: translateY(-2px);
          border-color: var(--primary-color);
          box-shadow: 0 8px 16px var(--shadow-color);
          background: var(--primary-light);
        }

        .action-emoji {
          font-size: 24px;
          width: 44px;
          height: 44px;
          background: var(--border-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .action-card-btn:hover .action-emoji {
          background: var(--bg-card);
        }

        .action-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
          padding-right: 16px;
        }

        .action-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-main);
        }

        .action-desc {
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .action-arrow {
          font-size: 16px;
          color: var(--text-muted);
          margin-left: auto;
          transition: transform 0.2s;
        }

        .action-card-btn:hover .action-arrow {
          transform: translateX(4px);
          color: var(--primary-color);
        }

        @media (max-width: 600px) {
          .actions-grid {
            grid-template-columns: 1fr;
          }
          .cards-grid {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .overview-card {
            padding: 12px;
            gap: 4px;
          }
          .card-main-value {
            font-size: 20px;
          }
          .card-main-value.text-small-val {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
