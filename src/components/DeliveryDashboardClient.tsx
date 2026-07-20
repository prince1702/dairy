"use client";

import React, { useState, useEffect } from "react";
import { completeDelivery, reportDeliveryIssue, undoDelivery } from "@/app/actions";

interface SubscriptionItem {
  product: {
    name: string;
    emoji: string;
    size: string;
    price: number;
  };
  quantity: number;
  isOverride?: boolean;
}

interface AssignedCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string | null;
  address: string | null;
  sequence: number;
  routeName?: string;
  routeId?: string;
  walletBalance?: number;
  accountStatus?: string;
  isPaused?: boolean;
  isVacation?: boolean;
  subscriptionItems: SubscriptionItem[];
}

interface DeliveryHistoryItem {
  id: string;
  customerId: string;
  deliveredAt: Date;
  itemsSnapshot: string;
  totalCost: number;
  status: string;
  issueNote?: string | null;
  customer?: {
    name: string;
    phone?: string | null;
    address?: string | null;
  };
}

interface DeliveryDashboardProps {
  deliveryPersonId: string;
  deliveryPersonName?: string;
  route: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  routes?: { id: string; name: string; description: string | null }[];
  customers: AssignedCustomer[];
  completedCustomerIds?: string[];
  deliveryHistoryLogs?: DeliveryHistoryItem[];
}

export function DeliveryDashboardClient({
  deliveryPersonId,
  deliveryPersonName = "Delivery Partner",
  route,
  routes = [],
  customers,
  completedCustomerIds = [],
  deliveryHistoryLogs = [],
}: DeliveryDashboardProps) {
  const [activeTab, setActiveTab] = useState<"checklist" | "history">("checklist");
  const [completedIds, setCompletedIds] = useState<string[]>(completedCustomerIds);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Confirmation Modal state
  const [confirmingCustomer, setConfirmingCustomer] = useState<AssignedCustomer | null>(null);

  // Undo Delivery state
  const [undoInfo, setUndoInfo] = useState<{
    deliveryId: string;
    customerId: string;
    customerName: string;
    timestamp: number;
  } | null>(null);
  const [undoing, setUndoing] = useState(false);

  // Issue reporting state
  const [reportingCustomerId, setReportingCustomerId] = useState<string | null>(null);
  const [issueNote, setIssueNote] = useState("");
  const [reportingSubmitting, setReportingSubmitting] = useState(false);

  // Search, Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "DELIVERED" | "PAUSED_VACATION">("ALL");
  const [filterRouteId, setFilterRouteId] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"SEQUENCE" | "NAME">("SEQUENCE");

  // History tab filter state
  const [historyFilter, setHistoryFilter] = useState<"TODAY" | "YESTERDAY" | "LAST_7" | "ALL">("TODAY");

  // Auto-clear undo info after 30 seconds
  useEffect(() => {
    if (!undoInfo) return;
    const timer = setTimeout(() => {
      setUndoInfo(null);
    }, 30000);
    return () => clearTimeout(timer);
  }, [undoInfo]);

  // Current Date & Day Name
  const now = new Date();
  const todayDateStr = now.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });

  // Route statistics calculation
  const totalCount = customers.length;
  const completedCount = customers.filter((c) => completedIds.includes(c.id)).length;
  const pendingCount = totalCount - completedCount;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isRouteCompleted = totalCount > 0 && completedCount === totalCount;

  // Execute delivery confirmation
  const handleConfirmDelivery = async () => {
    if (!confirmingCustomer) return;
    const customer = confirmingCustomer;
    setConfirmingCustomer(null);

    setSubmittingId(customer.id);
    setErrorMsg("");
    setSuccessInfo("");

    const res = await completeDelivery(deliveryPersonId, customer.id);
    setSubmittingId(null);

    if (res.success) {
      setCompletedIds((prev) => [...prev, customer.id]);
      setSuccessInfo(
        `Silent Delivery confirmed for ${customer.name}! Wallet deducted by ₹${res.details?.totalCost.toFixed(
          2
        )} & Notification dispatched.`
      );

      if (res.details?.deliveryId) {
        setUndoInfo({
          deliveryId: res.details.deliveryId,
          customerId: customer.id,
          customerName: customer.name,
          timestamp: Date.now(),
        });
      }
    } else {
      setErrorMsg(res.error || "Failed to mark delivery complete.");
    }
  };

  // Undo delivery handler
  const handleUndoDelivery = async () => {
    if (!undoInfo) return;
    setUndoing(true);
    setErrorMsg("");
    setSuccessInfo("");

    const res = await undoDelivery(deliveryPersonId, undoInfo.deliveryId);
    setUndoing(false);

    if (res.success) {
      setCompletedIds((prev) => prev.filter((id) => id !== undoInfo.customerId));
      setSuccessInfo(`Delivery for ${undoInfo.customerName} has been undone and wallet refunded.`);
      setUndoInfo(null);
    } else {
      setErrorMsg(res.error || "Failed to undo delivery.");
    }
  };

  // Issue report handler
  const handleReportSubmit = async (customerId: string, customerName: string) => {
    if (!issueNote.trim()) {
      setErrorMsg("Please enter an issue note.");
      return;
    }
    setReportingSubmitting(true);
    setErrorMsg("");
    setSuccessInfo("");

    const res = await reportDeliveryIssue(deliveryPersonId, customerId, issueNote.trim());
    setReportingSubmitting(false);

    if (res.success) {
      setCompletedIds((prev) => [...prev, customerId]);
      setReportingCustomerId(null);
      setIssueNote("");
      setSuccessInfo(`Delivery issue logged for ${customerName} and notified to Manager.`);
    } else {
      setErrorMsg(res.error || "Failed to report issue.");
    }
  };

  // Filter & sort customer list
  const filteredCustomers = customers
    .filter((c) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = (c.phone || "").toLowerCase().includes(q);
        const matchAddr = (c.address || "").toLowerCase().includes(q);
        const matchId = c.id.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchAddr && !matchId) return false;
      }

      // Status Filter
      const isDone = completedIds.includes(c.id);
      if (filterStatus === "PENDING" && isDone) return false;
      if (filterStatus === "DELIVERED" && !isDone) return false;
      if (filterStatus === "PAUSED_VACATION" && !c.isPaused && !c.isVacation) return false;

      // Route Filter
      if (filterRouteId !== "ALL" && c.routeId !== filterRouteId) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "NAME") {
        return a.name.localeCompare(b.name);
      }
      return a.sequence - b.sequence;
    });

  // History filtering
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const last7Start = new Date(todayStart);
  last7Start.setDate(last7Start.getDate() - 7);

  const filteredHistoryLogs = deliveryHistoryLogs.filter((log) => {
    const logDate = new Date(log.deliveredAt);
    if (historyFilter === "TODAY") return logDate >= todayStart;
    if (historyFilter === "YESTERDAY") return logDate >= yesterdayStart && logDate < todayStart;
    if (historyFilter === "LAST_7") return logDate >= last7Start;
    return true;
  });

  return (
    <main className="dashboard-main container">
      {/* 1. DASHBOARD HEADER & WELCOME */}
      <section className="welcome-banner card mt-4">
        <div className="flex-between">
          <div>
            <h1>Today's Delivery</h1>
            <p className="text-muted mt-1">
              📅 <strong>{todayDateStr}</strong> ({dayName}) &nbsp;•&nbsp; 👋 Welcome, <strong>{deliveryPersonName}</strong>
            </p>
          </div>
          <div className="routes-assigned-tag">
            {routes.length > 0 ? (
              routes.map((r) => <span key={r.id} className="badge badge-info" style={{ marginRight: "4px" }}>📍 {r.name}</span>)
            ) : (
              <span className="badge badge-warning">No Route Assigned Today</span>
            )}
          </div>
        </div>
      </section>

      {/* NAVIGATION TABS */}
      <div className="tab-bar mt-4">
        <button
          className={`tab-btn ${activeTab === "checklist" ? "active" : ""}`}
          onClick={() => setActiveTab("checklist")}
        >
          🚚 Today's Delivery Checklist
          {pendingCount > 0 && <span className="tab-count warning">{pendingCount} Pending</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          📜 Delivery History & Audit
          <span className="tab-count">{deliveryHistoryLogs.length}</span>
        </button>
      </div>

      {/* NOTIFICATIONS & UNDO BANNER */}
      {successInfo && <div className="badge badge-success mt-4 block-alert">{successInfo}</div>}
      {errorMsg && <div className="badge badge-danger mt-4 block-alert">{errorMsg}</div>}

      {undoInfo && (
        <div className="undo-banner card mt-4 flex-between" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
          <div>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e40af" }}>
              ✅ Delivery completed for <strong>{undoInfo.customerName}</strong>
            </span>
            <div className="text-muted" style={{ fontSize: "12px" }}>Made a mistake? You can undo this delivery within 30 seconds.</div>
          </div>
          <button onClick={handleUndoDelivery} disabled={undoing} className="btn btn-primary" style={{ background: "#2563eb", padding: "6px 14px", fontSize: "12px" }}>
            {undoing ? "Undoing..." : "↺ Undo Delivery"}
          </button>
        </div>
      )}

      {/* ─── TAB 1: TODAY'S DELIVERY CHECKLIST ─── */}
      {activeTab === "checklist" && (
        <>
          {/* ROUTE SUMMARY CARDS & PROGRESS BAR */}
          <div className="stats-grid mt-4">
            <div className="stat-card card text-center">
              <span className="stat-value">{totalCount}</span>
              <span className="stat-title">Total Customers</span>
            </div>
            <div className="stat-card card text-center">
              <span className="stat-value text-success">{completedCount}</span>
              <span className="stat-title">Delivered</span>
            </div>
            <div className="stat-card card text-center">
              <span className="stat-value text-warning">{pendingCount}</span>
              <span className="stat-title">Pending</span>
            </div>
            <div className="stat-card card text-center">
              <span className="stat-value text-primary">{completionPct}%</span>
              <span className="stat-title">Completion</span>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="progress-bar-container card mt-3" style={{ padding: "12px 16px" }}>
            <div className="flex-between mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>
              <span>Route Completion Progress</span>
              <span>{completedCount} of {totalCount} ({completionPct}%)</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${completionPct}%` }}></div>
            </div>
          </div>

          {/* 100% ROUTE COMPLETION CELEBRATION BANNER */}
          {isRouteCompleted && (
            <div className="celebration-card card mt-4 text-center">
              <h2>🎉 Today's Route Completed! 🎉</h2>
              <p style={{ fontSize: "16px", marginTop: "4px", color: "var(--green)" }}>
                <strong>{totalCount} / {totalCount}</strong> Deliveries Completed. Excellent Job!
              </p>
            </div>
          )}

          {/* SEARCH & FILTERS BAR */}
          <div className="filter-bar card mt-4" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px" }}>🔍 Search</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search name, phone, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px" }}>⚡ Delivery Status</label>
              <select
                className="form-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="ALL">All Customers ({totalCount})</option>
                <option value="PENDING">Pending Only ({pendingCount})</option>
                <option value="DELIVERED">Delivered Only ({completedCount})</option>
                <option value="PAUSED_VACATION">Paused / Vacation</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px" }}>📍 Route Filter</label>
              <select
                className="form-input"
                value={filterRouteId}
                onChange={(e) => setFilterRouteId(e.target.value)}
              >
                <option value="ALL">All Routes</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px" }}>🔢 Sort Order</label>
              <select
                className="form-input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="SEQUENCE">Route Sequence (#)</option>
                <option value="NAME">Customer Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* TODAY'S CUSTOMER LIST */}
          <div className="card checklist-card mt-4">
            <div className="flex-between mb-3">
              <h3>Today's Customer Delivery Sheet</h3>
              <span className="text-muted" style={{ fontSize: "12px" }}>
                Showing {filteredCustomers.length} of {totalCount} Customers
              </span>
            </div>

            <div className="checklist-list">
              {filteredCustomers.length === 0 ? (
                <p className="text-muted text-center py-8">No customers matching current search/filter.</p>
              ) : (
                filteredCustomers.map((c) => {
                  const isCompleted = completedIds.includes(c.id);
                  const isLowBalance = (c.walletBalance || 0) < 50;

                  return (
                    <div key={c.id} className={`checklist-item card ${isCompleted ? "completed" : ""}`}>
                      <div className="item-header flex-between">
                        <div className="item-seq-name">
                          <span className="seq-badge">#{c.sequence}</span>
                          <div>
                            <strong>{c.name}</strong>
                            <div className="text-muted" style={{ fontSize: "12px" }}>
                              📞 {c.phone || "No phone"} &nbsp;•&nbsp; 📍 {c.routeName}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          {/* Wallet Badge */}
                          <span className={`badge ${isLowBalance ? "badge-danger" : "badge-info"}`} style={{ fontSize: "11px" }}>
                            ₹{(c.walletBalance || 0).toFixed(2)}
                          </span>

                          {/* Pause / Vacation Badges */}
                          {c.isVacation && <span className="badge badge-warning">On Vacation</span>}
                          {c.isPaused && <span className="badge badge-warning">Paused Today</span>}

                          {/* Action Button / Completed Tag */}
                          {isCompleted ? (
                            <span className="badge badge-success">Done ✓</span>
                          ) : (
                            <>
                              <button
                                onClick={() => setConfirmingCustomer(c)}
                                disabled={submittingId === c.id || reportingSubmitting || c.subscriptionItems.length === 0}
                                className="btn btn-primary complete-btn"
                              >
                                {submittingId === c.id ? "Processing..." : "Mark Delivered"}
                              </button>
                              <button
                                onClick={() => {
                                  if (reportingCustomerId === c.id) {
                                    setReportingCustomerId(null);
                                  } else {
                                    setReportingCustomerId(c.id);
                                    setIssueNote("");
                                  }
                                }}
                                className="btn btn-outline"
                                style={{ padding: "6px 10px", fontSize: "11px" }}
                              >
                                {reportingCustomerId === c.id ? "Cancel" : "Report Issue"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* ISSUE REPORTING FORM */}
                      {reportingCustomerId === c.id && !isCompleted && (
                        <div className="issue-box mt-3" style={{ background: "var(--white)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", display: "block", marginBottom: "4px" }}>
                            Issue Note for Manager:
                          </label>
                          <textarea
                            rows={2}
                            className="form-input"
                            style={{ width: "100%", fontSize: "13px", marginBottom: "8px" }}
                            placeholder="e.g. Door locked, customer out of town, product damaged..."
                            value={issueNote}
                            onChange={(e) => setIssueNote(e.target.value)}
                          />
                          <button
                            onClick={() => handleReportSubmit(c.id, c.name)}
                            disabled={reportingSubmitting}
                            className="btn btn-primary"
                            style={{ padding: "6px 14px", fontSize: "12px" }}
                          >
                            {reportingSubmitting ? "Submitting..." : "Submit Issue Report"}
                          </button>
                        </div>
                      )}

                      {/* CUSTOMER DETAILS & PRODUCTS */}
                      <div className="item-details mt-3">
                        <div className="detail-row">
                          <strong>Address:</strong> {c.address || "Not specified"}
                        </div>
                        <div className="detail-row mt-2">
                          <strong>Today's Products:</strong>
                          <div className="products-checklist mt-1">
                            {c.isVacation ? (
                              <span className="text-muted" style={{ fontSize: "12px", fontStyle: "italic" }}>No delivery (Customer on vacation)</span>
                            ) : c.isPaused ? (
                              <span className="text-muted" style={{ fontSize: "12px", fontStyle: "italic" }}>No delivery (Delivery paused for today)</span>
                            ) : c.subscriptionItems.length === 0 ? (
                              <span className="text-muted" style={{ fontSize: "12px", fontStyle: "italic" }}>No items scheduled for today</span>
                            ) : (
                              c.subscriptionItems.map((item, idx) => (
                                <span key={idx} className="product-badge">
                                  {item.product.emoji} {item.quantity}x {item.product.name} ({item.product.size})
                                  {item.isOverride && <span style={{ marginLeft: "4px", color: "var(--amber-dark)" }}>[Override]</span>}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── TAB 2: DELIVERY HISTORY & AUDIT LOG ─── */}
      {activeTab === "history" && (
        <div className="card mt-4">
          <div className="flex-between mb-4">
            <div>
              <h3>Delivery History & Audit Log</h3>
              <p className="text-muted">Review past completed deliveries and reported issues.</p>
            </div>
            <div className="history-filter-buttons" style={{ display: "flex", gap: "6px" }}>
              <button
                className={`btn ${historyFilter === "TODAY" ? "btn-primary" : "btn-outline"}`}
                style={{ padding: "4px 10px", fontSize: "12px" }}
                onClick={() => setHistoryFilter("TODAY")}
              >
                Today
              </button>
              <button
                className={`btn ${historyFilter === "YESTERDAY" ? "btn-primary" : "btn-outline"}`}
                style={{ padding: "4px 10px", fontSize: "12px" }}
                onClick={() => setHistoryFilter("YESTERDAY")}
              >
                Yesterday
              </button>
              <button
                className={`btn ${historyFilter === "LAST_7" ? "btn-primary" : "btn-outline"}`}
                style={{ padding: "4px 10px", fontSize: "12px" }}
                onClick={() => setHistoryFilter("LAST_7")}
              >
                Last 7 Days
              </button>
              <button
                className={`btn ${historyFilter === "ALL" ? "btn-primary" : "btn-outline"}`}
                style={{ padding: "4px 10px", fontSize: "12px" }}
                onClick={() => setHistoryFilter("ALL")}
              >
                All Time
              </button>
            </div>
          </div>

          <div className="requests-table-wrapper">
            {filteredHistoryLogs.length === 0 ? (
              <p className="text-muted text-center py-8">No delivery logs found for the selected period.</p>
            ) : (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Customer Name</th>
                    <th>Address / Phone</th>
                    <th>Delivered Products</th>
                    <th>Wallet Deducted</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistoryLogs.map((log) => {
                    let itemsStr = "[]";
                    try {
                      const parsed = JSON.parse(log.itemsSnapshot);
                      itemsStr = parsed.map((i: any) => `${i.quantity}x ${i.name} (${i.size})`).join(", ");
                    } catch (e) {
                      itemsStr = log.itemsSnapshot;
                    }

                    const formattedDate = new Date(log.deliveredAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr key={log.id}>
                        <td>{formattedDate}</td>
                        <td>
                          <strong>{log.customer?.name || "Customer"}</strong>
                        </td>
                        <td className="text-muted" style={{ fontSize: "12px" }}>
                          {log.customer?.address || "N/A"}<br />
                          {log.customer?.phone || ""}
                        </td>
                        <td style={{ fontSize: "13px" }}>{itemsStr || "No items"}</td>
                        <td>
                          <strong style={{ color: "var(--green)" }}>₹{log.totalCost.toFixed(2)}</strong>
                        </td>
                        <td>
                          <span className={`badge badge-${log.status === "DELIVERED" ? "success" : "danger"}`}>
                            {log.status}
                          </span>
                          {log.issueNote && <div className="text-muted" style={{ fontSize: "11px", marginTop: "2px" }}>Note: {log.issueNote}</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── CONFIRMATION DIALOG MODAL ─── */}
      {confirmingCustomer && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <div className="flex-between mb-3">
              <h3 style={{ margin: 0, color: "var(--green)" }}>Confirm Delivery</h3>
              <button onClick={() => setConfirmingCustomer(null)} className="close-btn">&times;</button>
            </div>
            <p className="text-muted mb-3" style={{ fontSize: "13px" }}>
              Please verify the items delivered for <strong>{confirmingCustomer.name}</strong> before confirming:
            </p>

            <div className="modal-summary card mb-4" style={{ background: "var(--cream)", padding: "12px" }}>
              <div style={{ fontSize: "13px", marginBottom: "6px" }}>
                📍 <strong>Address:</strong> {confirmingCustomer.address || "N/A"}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>
                📦 Products to Deliver:
              </div>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px" }}>
                {confirmingCustomer.subscriptionItems.map((item, idx) => (
                  <li key={idx}>
                    {item.product.emoji} {item.quantity}x {item.product.name} ({item.product.size}) — ₹{(item.product.price * item.quantity).toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmingCustomer(null)} className="btn btn-outline">
                Cancel
              </button>
              <button onClick={handleConfirmDelivery} className="btn btn-primary">
                Confirm & Mark Delivered
              </button>
            </div>
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
          margin-bottom: 4px;
        }
        .block-alert {
          display: block;
          text-align: center;
          padding: 10px;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .stat-card {
          padding: 16px;
        }
        .stat-value {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 700;
          display: block;
          color: var(--text);
        }
        .stat-value.text-success { color: var(--green); }
        .stat-value.text-warning { color: var(--amber-dark); }
        .stat-value.text-primary { color: #2563eb; }
        .stat-title {
          font-size: 11px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        /* Progress track */
        .progress-track {
          width: 100%;
          height: 10px;
          background: var(--border-light);
          border-radius: 10px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--green) 0%, #22c55e 100%);
          transition: width 0.4s ease;
        }

        .celebration-card {
          background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%);
          border: 2px solid var(--green);
          padding: 24px;
        }
        .celebration-card h2 {
          color: var(--green);
          font-family: var(--font-display);
          font-size: 24px;
          margin: 0;
        }

        /* Tab Bar */
        .tab-bar {
          display: flex;
          gap: 4px;
          border-bottom: 2px solid var(--border);
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
          transition: all 0.2s;
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
        .tab-count.warning {
          background: #fee2e2;
          color: #b91c1c;
        }

        /* Checklist list */
        .checklist-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .checklist-item {
          background: var(--cream);
          transition: all 0.2s;
        }
        .checklist-item.completed {
          opacity: 0.75;
          border-color: var(--success);
          background: var(--white);
        }
        .item-seq-name {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .seq-badge {
          background: var(--green);
          color: var(--white);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
        }
        .complete-btn {
          font-size: 12px;
          padding: 8px 16px;
        }
        .item-details {
          background: var(--white);
          padding: 14px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          font-size: 13px;
        }
        .detail-row strong {
          color: var(--muted);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 2px;
        }
        .products-checklist {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .product-badge {
          background: var(--green-light);
          color: var(--green);
          border: 1px solid rgba(26, 107, 60, 0.15);
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
        }

        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          max-width: 480px;
          width: 100%;
          background: var(--white);
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: var(--muted);
        }

        /* History table styling */
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

        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
          .filter-bar {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

