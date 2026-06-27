"use client";

import React, { useState } from "react";
import { createPaymentRequest, updateSubscription } from "@/app/actions";
import { uploadScreenshot } from "@/lib/upload";

interface Product {
  id: string;
  name: string;
  emoji: string;
  category: string;
  price: number;
  size: string;
}

interface DeliveryRecord {
  id: string;
  deliveredAt: Date;
  itemsSnapshot: string;
  totalCost: number;
  status: string;
  issueNote: string | null;
}

interface CustomerDashboardProps {
  customer: {
    id: string;
    name: string;
    email: string;
    address: string | null;
  };
  wallet: {
    id: string;
    balance: number;
    transactions: {
      id: string;
      beforeBalance: number;
      afterBalance: number;
      changeAmount: number;
      source: string;
      description: string | null;
      timestamp: Date;
    }[];
  } | null;
  subscriptionItems: {
    productId: string;
    quantity: number;
  }[];
  products: Product[];
  paymentRequests: {
    id: string;
    amount: number;
    screenshotUrl: string;
    status: string;
    createdAt: Date;
  }[];
  notifications: {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    timestamp: Date;
  }[];
  deliveries?: DeliveryRecord[];
}

export function CustomerDashboardClient({
  customer,
  wallet,
  subscriptionItems,
  products,
  paymentRequests,
  notifications,
  deliveries = [],
}: CustomerDashboardProps) {
  // Subscription state
  const [subQuantities, setSubQuantities] = useState<Record<string, number>>(() => {
    const quantities: Record<string, number> = {};
    products.forEach((p) => {
      const existing = subscriptionItems.find((item) => item.productId === p.id);
      quantities[p.id] = existing ? existing.quantity : 0;
    });
    return quantities;
  });
  const [subSubmitting, setSubSubmitting] = useState(false);
  const [subSuccess, setSubSuccess] = useState(false);

  // Recharge state
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [rechargeSubmitting, setRechargeSubmitting] = useState(false);
  const [rechargeSuccess, setRechargeSuccess] = useState(false);
  const [rechargeError, setRechargeError] = useState("");

  const handleQtyChange = (productId: string, val: number) => {
    setSubQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubSubmitting(true);
    setSubSuccess(false);

    const items = Object.entries(subQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, qty]) => ({ productId, quantity: qty }));

    const res = await updateSubscription(customer.id, items);
    setSubSubmitting(false);

    if (res.success) {
      setSubSuccess(true);
      setTimeout(() => setSubSuccess(false), 3000);
    }
  };

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rechargeAmount || isNaN(Number(rechargeAmount)) || Number(rechargeAmount) <= 0) {
      setRechargeError("Please enter a valid recharge amount.");
      return;
    }
    if (!screenshotFile) {
      setRechargeError("Please select a screenshot of the payment receipt.");
      return;
    }

    setRechargeSubmitting(true);
    setRechargeError("");
    setRechargeSuccess(false);

    try {
      // 1. Upload file using Cloudinary / simulated helper
      const screenshotUrl = await uploadScreenshot(screenshotFile);

      // 2. Submit payment request record to DB
      const res = await createPaymentRequest(
        customer.id,
        Number(rechargeAmount),
        screenshotUrl
      );

      if (res.success) {
        setRechargeSuccess(true);
        setRechargeAmount("");
        setScreenshotFile(null);
        // Clear input file
        const fileInput = document.getElementById("receipt-file") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setRechargeError(res.error || "Failed to submit request.");
      }
    } catch (err: any) {
      setRechargeError(err.message || "An error occurred.");
    } finally {
      setRechargeSubmitting(false);
    }
  };

  return (
    <main className="dashboard-main container">
      {/* Top Welcome Message */}
      <section className="welcome-banner card mt-4">
        <h1>Your Dairy Dashboard</h1>
        <p className="text-muted">Manage your daily subscriptions, recharge your wallet, and track silent morning deliveries.</p>
        {customer.address && (
          <div className="address-banner mt-4">
            📍 <strong>Delivery Address:</strong> {customer.address}
          </div>
        )}
      </section>

      <div className="dashboard-grid">
        {/* LEFT COLUMN: WALLET & NOTIFICATIONS */}
        <div className="grid-column">
          {/* Wallet Card */}
          <div className="card wallet-card">
            <div className="wallet-header">
              <span className="label">WALLET BALANCE</span>
              <span className="balance">₹{wallet?.balance.toFixed(2) || "0.00"}</span>
            </div>

            <form onSubmit={handleRechargeSubmit} className="recharge-form mt-4">
              <h3>Request Balance Recharge</h3>
              {rechargeError && <div className="badge badge-danger mb-4 block-alert">{rechargeError}</div>}
              {rechargeSuccess && <div className="badge badge-success mb-4 block-alert">Recharge request submitted! Pending approval.</div>}

              <div className="form-group">
                <label className="form-label" htmlFor="amount">Recharge Amount (₹)</label>
                <input
                  id="amount"
                  type="number"
                  className="form-input"
                  placeholder="e.g. 500"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  disabled={rechargeSubmitting}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="receipt-file">Upload Payment Screenshot</label>
                <input
                  id="receipt-file"
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                  disabled={rechargeSubmitting}
                  required
                />
                <span className="file-hint text-muted">UPI, GPay, or NetBanking receipt screenshot</span>
              </div>

              <button type="submit" className="btn btn-secondary w-full" disabled={rechargeSubmitting}>
                {rechargeSubmitting ? "Submitting..." : "Submit Receipt Screenshot"}
              </button>
            </form>
          </div>

          {/* Notifications Panel */}
          <div className="card notifications-card mt-4">
            <h3>Notifications & Silent Delivery logs</h3>
            <div className="notifications-list mt-4">
              {notifications.length === 0 ? (
                <p className="text-muted text-center py-4">No notifications yet.</p>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className={`notif-item ${notif.type.toLowerCase()}`}>
                    <div className="notif-header">
                      <strong>{notif.title}</strong>
                      <span className="notif-time">
                        {new Date(notif.timestamp).toLocaleDateString()} at{" "}
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="notif-msg">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SUBSCRIPTIONS & TRANSACTIONS */}
        <div className="grid-column">
          {/* Subscription Manager */}
          <div className="card subscription-card">
            <h3>Modify Subscription Schedule</h3>
            <p className="text-muted mb-4">Set the quantity of each dairy item you want delivered daily.</p>
            {subSuccess && <div className="badge badge-success mb-4 block-alert">Subscription schedule updated successfully!</div>}

            <form onSubmit={handleSubSubmit}>
              <div className="products-list">
                {products.map((p) => (
                  <div key={p.id} className="sub-product-row flex-between">
                    <div className="product-info">
                      <span className="emoji">{p.emoji}</span>
                      <div>
                        <strong>{p.name}</strong>
                        <div className="size text-muted">{p.size} • ₹{p.price.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="quantity-selector">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => handleQtyChange(p.id, subQuantities[p.id] - 1)}
                        disabled={subSubmitting}
                      >
                        -
                      </button>
                      <span className="qty-val">{subQuantities[p.id]}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => handleQtyChange(p.id, subQuantities[p.id] + 1)}
                        disabled={subSubmitting}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" className="btn btn-primary w-full mt-4" disabled={subSubmitting}>
                {subSubmitting ? "Saving..." : "Save Delivery Schedule"}
              </button>
            </form>
          </div>

          {/* Recharge Requests */}
          <div className="card recharge-requests-card mt-4">
            <h3>Recent Recharge Requests</h3>
            <div className="requests-table-wrapper mt-4">
              {paymentRequests.length === 0 ? (
                <p className="text-muted text-center py-4">No recharge requests yet.</p>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Receipt</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentRequests.map((req) => (
                      <tr key={req.id}>
                        <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                        <td><strong>₹{req.amount.toFixed(2)}</strong></td>
                        <td>
                          <a href={req.screenshotUrl} target="_blank" rel="noreferrer" className="receipt-link">
                            View Receipt 🔗
                          </a>
                        </td>
                        <td>
                          <span className={`badge badge-${req.status === "APPROVED" ? "success" : req.status === "PENDING" ? "warning" : "danger"}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Audit Transactions Log */}
          <div className="card transactions-card mt-4">
            <h3>Audited Wallet Transactions</h3>
            <div className="transactions-list mt-4">
              {!wallet || wallet.transactions.length === 0 ? (
                <p className="text-muted text-center py-4">No transactions recorded yet.</p>
              ) : (
                wallet.transactions.map((tx) => (
                  <div key={tx.id} className="tx-item flex-between">
                    <div className="tx-info">
                      <strong>{tx.description || tx.source}</strong>
                      <div className="tx-time text-muted">
                        {new Date(tx.timestamp).toLocaleDateString()}
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

          {/* Delivery History */}
          <div className="card delivery-history-card mt-4">
            <h3>Delivery History</h3>
            <div className="transactions-list mt-4">
              {deliveries.length === 0 ? (
                <p className="text-muted text-center py-4">No delivery history records yet.</p>
              ) : (
                deliveries.map((del) => {
                  let items: any[] = [];
                  try { items = JSON.parse(del.itemsSnapshot); } catch {}
                  return (
                    <div key={del.id} className="tx-item flex-between">
                      <div className="tx-info">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong>{new Date(del.deliveredAt).toLocaleDateString()}</strong>
                          <span className={`badge badge-${del.status === "DELIVERED" ? "success" : "danger"}`}>
                            {del.status === "DELIVERED" ? "Delivered ✓" : "Issue Reported"}
                          </span>
                        </div>
                        {del.issueNote && (
                          <div className="text-muted" style={{ fontSize: "12px", marginTop: "2px", color: "#b91c1c" }}>
                            Note: {del.issueNote}
                          </div>
                        )}
                        <div className="tx-time text-muted" style={{ marginTop: "4px" }}>
                          {items.length > 0
                            ? items.map((i: any) => `${i.quantity}x ${i.name} (${i.size})`).join(", ")
                            : "No items listed"}
                        </div>
                      </div>
                      <div className="tx-amount negative" style={{ textAlign: "right" }}>
                        -₹{del.totalCost.toFixed(2)}
                      </div>
                    </div>
                  );
                })
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
        .address-banner {
          background: var(--green-light);
          color: var(--green-dark);
          padding: 10px 16px;
          border-radius: var(--radius-sm);
          font-size: 14px;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 24px;
        }
        .grid-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .w-full {
          width: 100%;
        }
        .block-alert {
          display: block;
          text-align: center;
          padding: 8px;
        }
        .file-hint {
          display: block;
          font-size: 11px;
          margin-top: 4px;
        }

        /* Wallet specific styling */
        .wallet-card {
          background: linear-gradient(135deg, var(--green-dark) 0%, var(--green) 100%);
          color: var(--white);
        }
        .wallet-card h3 {
          color: var(--white);
          margin-bottom: 16px;
        }
        .wallet-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          padding-bottom: 16px;
        }
        .wallet-header .label {
          font-size: 11px;
          opacity: 0.8;
          display: block;
          letter-spacing: 0.05em;
        }
        .wallet-header .balance {
          font-size: 42px;
          font-weight: 700;
          display: block;
          line-height: 1.1;
        }
        .recharge-form {
          background: rgba(255, 255, 255, 0.08);
          padding: 20px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .recharge-form label {
          color: var(--white);
        }
        .recharge-form input {
          background: rgba(0, 0, 0, 0.15);
          border-color: rgba(255, 255, 255, 0.2);
          color: var(--white);
        }
        .recharge-form input:focus {
          border-color: var(--amber);
          box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.25);
        }

        /* Subscription Form styling */
        .products-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sub-product-row {
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 12px;
        }
        .sub-product-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .product-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .product-info .emoji {
          font-size: 28px;
          background: var(--green-light);
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .quantity-selector {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 4px;
          background: var(--cream);
        }
        .qty-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: var(--white);
          color: var(--text);
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .qty-btn:hover:not(:disabled) {
          background: var(--green-light);
          color: var(--green);
        }
        .qty-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .qty-val {
          font-weight: 600;
          width: 20px;
          text-align: center;
        }

        /* Notification List styling */
        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
        }
        .notif-item {
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          background: var(--cream);
          border-left: 4px solid var(--green);
        }
        .notif-item.wallet {
          border-left-color: var(--amber);
        }
        .notif-header {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 4px;
        }
        .notif-time {
          color: var(--muted);
          font-size: 11px;
        }
        .notif-msg {
          font-size: 13px;
          line-height: 1.5;
        }

        /* Transactions list styling */
        .transactions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
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
        .tx-time {
          font-size: 11px;
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

        /* Requests table styling */
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
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-light);
        }
        .dashboard-table th {
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
        }
        .receipt-link {
          color: var(--green);
          font-weight: 600;
          font-size: 12px;
        }
        .receipt-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
