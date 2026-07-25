"use client";

import React, { useState } from "react";
import {
  markNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  markNotificationReadSingle
} from "@/app/customer-actions";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  timestamp: string;
}

interface NotificationsClientViewProps {
  customer: {
    id: string;
    name: string;
    email: string;
  };
  notifications: Notification[];
}

export function NotificationsClientView({
  customer,
  notifications,
}: NotificationsClientViewProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "WALLET" | "DELIVERY" | "SYSTEM">("ALL");

  const handleMarkAllRead = async () => {
    setSubmitting(true);
    try {
      const res = await markNotificationsRead(customer.id);
      if (res.success) {
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to delete all notifications? This cannot be undone.")) return;
    setSubmitting(true);
    try {
      const res = await clearAllNotifications(customer.id);
      if (res.success) {
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await markNotificationReadSingle(customer.id, id);
      if (res.success) {
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await deleteNotification(customer.id, id);
      if (res.success) {
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Filters notifications
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "ALL") return true;
    return n.type.toUpperCase() === activeTab;
  });

  const getNotifIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("wallet") || t.includes("recharge")) return "💰";
    if (t.includes("delivery")) return "✅";
    if (t.includes("vacation") || t.includes("pause")) return "⏸️";
    return "🔔";
  };

  return (
    <div className="notifications-container card">
      <div className="notifications-header">
        <div>
          <h3>Notifications & Activity Alerts</h3>
          <p className="text-muted">Manage your daily delivery reports, credits, and system audit logs.</p>
        </div>
        
        {/* Header Action Row */}
        <div className="header-actions">
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              disabled={submitting}
              className="btn btn-outline mark-read-btn"
            >
              Mark All Read ✓
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={submitting}
              className="btn btn-danger clear-all-btn"
            >
              Clear All Logs 🗑️
            </button>
          )}
        </div>
      </div>

      {/* Tab Filter Links */}
      <div className="notifications-tabs mt-6">
        <button
          className={`tab-btn-item ${activeTab === "ALL" ? "active" : ""}`}
          onClick={() => setActiveTab("ALL")}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          className={`tab-btn-item ${activeTab === "DELIVERY" ? "active" : ""}`}
          onClick={() => setActiveTab("DELIVERY")}
        >
          Deliveries ({notifications.filter(n => n.type.toUpperCase() === "DELIVERY").length})
        </button>
        <button
          className={`tab-btn-item ${activeTab === "WALLET" ? "active" : ""}`}
          onClick={() => setActiveTab("WALLET")}
        >
          Wallet Credits ({notifications.filter(n => n.type.toUpperCase() === "WALLET").length})
        </button>
        <button
          className={`tab-btn-item ${activeTab === "SYSTEM" ? "active" : ""}`}
          onClick={() => setActiveTab("SYSTEM")}
        >
          System Updates ({notifications.filter(n => n.type.toUpperCase() === "SYSTEM").length})
        </button>
      </div>

      <div className="notifications-list mt-4">
        {filteredNotifications.length === 0 ? (
          <div className="no-notifications py-8 text-center text-muted">
            📭 No matching notifications or alerts found.
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const time = new Date(notif.timestamp);
            return (
              <div
                key={notif.id}
                className={`notif-item-row ${notif.type.toLowerCase()} ${notif.isRead ? "read" : "unread"}`}
              >
                <span className="notif-icon-avatar">{getNotifIcon(notif.type)}</span>
                
                <div className="notif-content-col">
                  <div className="notif-meta-title-row">
                    <strong className="notif-title">{notif.title}</strong>
                    <span className="notif-time text-muted">
                      {time.toLocaleDateString()} at{" "}
                      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="notif-message-text">{notif.message}</p>
                  
                  {/* Mark single as read button if unread */}
                  {!notif.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkSingleRead(notif.id)}
                      disabled={submitting}
                      className="mark-single-read-btn mt-2"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteSingle(notif.id)}
                  disabled={submitting}
                  className="delete-notif-btn"
                  title="Delete notification"
                  aria-label="Delete notification"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .notifications-container {
          display: flex;
          flex-direction: column;
        }

        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .mark-read-btn, .clear-all-btn {
          padding: 8px 16px;
          font-size: 13px;
          border-radius: 8px;
        }

        /* Tabs styling */
        .notifications-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tab-btn-item {
          padding: 6px 12px;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab-btn-item:hover {
          background: var(--border-light);
          color: var(--text-main);
        }

        .tab-btn-item.active {
          background: var(--primary-light);
          color: var(--primary-color);
          border-color: var(--primary-color);
          font-weight: 600;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .no-notifications {
          font-size: 14px;
          font-style: italic;
        }

        .notif-item-row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          border-radius: 8px;
          background: var(--bg-app);
          border: 1px solid var(--border-color);
          position: relative;
          transition: border-color 0.2s;
        }

        .notif-item-row.unread {
          border-left: 4px solid var(--primary-color);
          background: var(--bg-card);
        }

        .notif-item-row.wallet.unread {
          border-left-color: var(--accent-color);
        }

        .notif-item-row.read {
          opacity: 0.75;
        }

        .notif-icon-avatar {
          font-size: 20px;
          width: 36px;
          height: 36px;
          background: var(--border-light);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .notif-content-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
          padding-right: 24px;
        }

        .notif-meta-title-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
        }

        .notif-title {
          font-size: 15px;
          color: var(--text-main);
        }

        .notif-time {
          font-size: 11px;
          white-space: nowrap;
        }

        .notif-message-text {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .mark-single-read-btn {
          background: transparent;
          border: none;
          color: var(--primary-color);
          font-weight: 600;
          font-size: 11px;
          cursor: pointer;
          align-self: flex-start;
          padding: 2px 0;
        }

        .mark-single-read-btn:hover {
          text-decoration: underline;
        }

        .delete-notif-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .delete-notif-btn:hover {
          background: var(--danger-light);
          color: var(--danger-color);
        }

        @media (max-width: 600px) {
          .notif-meta-title-row {
            flex-direction: column;
            gap: 2px;
          }
          .notif-time {
            margin-top: 1px;
          }
          .header-actions {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}
