"use client";

import React, { useState } from "react";
import { markNotificationsRead, deleteNotification } from "@/app/customer-actions";
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

  const handleDelete = async (id: string) => {
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
          <h3>All Notifications</h3>
          <p className="text-muted">Stay updated with your daily deliveries, payment credits, and account configurations.</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            disabled={submitting}
            className="btn btn-outline mark-read-btn"
          >
            Mark All Read ✓
          </button>
        )}
      </div>

      <div className="notifications-list mt-6">
        {notifications.length === 0 ? (
          <div className="no-notifications py-8 text-center text-muted">
            📭 No notifications or logs found.
          </div>
        ) : (
          notifications.map((notif) => {
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
                </div>
                <button
                  onClick={() => handleDelete(notif.id)}
                  disabled={submitting}
                  className="delete-notif-btn"
                  title="Delete notification"
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
        }

        .mark-read-btn {
          padding: 8px 16px;
          font-size: 13px;
          border-radius: 8px;
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
          opacity: 0.8;
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
        }
      `}</style>
    </div>
  );
}
