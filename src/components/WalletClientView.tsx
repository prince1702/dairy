"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Transaction {
  id: string;
  beforeBalance: number;
  afterBalance: number;
  changeAmount: number;
  source: string;
  description: string | null;
  timestamp: Date;
}

interface PaymentRequest {
  id: string;
  amount: number;
  screenshotUrl: string;
  status: string;
  createdAt: Date;
}

interface WalletClientViewProps {
  customer: {
    id: string;
    name: string;
    email: string;
  };
  wallet: {
    id: string;
    balance: number;
    transactions: Transaction[];
  } | null;
  paymentRequests: PaymentRequest[];
}

export function WalletClientView({
  customer,
  wallet,
  paymentRequests,
}: WalletClientViewProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "DEDUCTIONS" | "RECHARGES">("ALL");

  const transactions = wallet?.transactions || [];

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "DEDUCTIONS") return tx.source === "DELIVERY_DEDUCTION";
    return false;
  });

  // Calculate wallet runway analytics
  const dailyDeductions = transactions.filter(t => t.source === "DELIVERY_DEDUCTION");
  const averageDeliveryCost = dailyDeductions.length > 0 
    ? Math.abs(dailyDeductions.reduce((sum, t) => sum + t.changeAmount, 0) / dailyDeductions.length) 
    : 0;

  const runwayDays = averageDeliveryCost > 0 && wallet 
    ? Math.floor(wallet.balance / averageDeliveryCost) 
    : 0;

  const totalAutoDeductions = dailyDeductions.length;

  return (
    <div className="wallet-container">
      {/* Wallet Balance Hero Card */}
      <div className="wallet-hero-card">
        <div className="hero-details">
          <span className="hero-label">CURRENT WALLET BALANCE</span>
          <h2 className="hero-balance">₹{wallet?.balance.toFixed(2) || "0.00"}</h2>
          <p className="hero-subtext">
            {wallet && wallet.balance < 150 ? (
              <span className="low-bal-warning">⚠️ Low Balance! Top up soon to prevent delivery interruption.</span>
            ) : (
              "Secure auto-deduction active for daily morning silent deliveries."
            )}
          </p>
        </div>
        <div className="hero-actions">
          <Link href="/customer/recharge" className="btn btn-secondary recharge-btn">
            💳 Recharge Wallet
          </Link>
        </div>
      </div>

      {/* Wallet Analytics Grid Section */}
      <div className="wallet-analytics-grid">
        <div className="analytics-card card">
          <span className="analytics-icon">📊</span>
          <div className="analytics-data">
            <strong>₹{averageDeliveryCost.toFixed(2)}</strong>
            <span className="text-muted">Average Delivery Cost</span>
          </div>
        </div>
        <div className="analytics-card card">
          <span className="analytics-icon">🗓️</span>
          <div className="analytics-data">
            <strong>{runwayDays > 0 ? `${runwayDays} Days` : "N/A"}</strong>
            <span className="text-muted">Estimated Wallet Runway</span>
          </div>
        </div>
        <div className="analytics-card card">
          <span className="analytics-icon">🔄</span>
          <div className="analytics-data">
            <strong>{totalAutoDeductions} debits</strong>
            <span className="text-muted">Total Auto-Deductions</span>
          </div>
        </div>
      </div>

      {/* Tabs Selector Card */}
      <div className="wallet-tabs-card card">
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === "ALL" ? "active" : ""}`}
            onClick={() => setActiveTab("ALL")}
          >
            📋 All Transactions
          </button>
          <button
            className={`tab-btn ${activeTab === "DEDUCTIONS" ? "active" : ""}`}
            onClick={() => setActiveTab("DEDUCTIONS")}
          >
            🚚 Auto-Deductions (Deliveries)
          </button>
          <button
            className={`tab-btn ${activeTab === "RECHARGES" ? "active" : ""}`}
            onClick={() => setActiveTab("RECHARGES")}
          >
            💳 Recharge Logs ({paymentRequests.length})
          </button>
        </div>

        {/* Transactions / Recharges Content */}
        <div className="tabs-content">
          {activeTab !== "RECHARGES" ? (
            <div className="timeline-wrapper">
              {filteredTransactions.length === 0 ? (
                <p className="empty-text text-center py-6 text-muted">No transactions recorded yet.</p>
              ) : (
                <div className="vertical-timeline">
                  {filteredTransactions.map((tx, index) => {
                    const isCredit = tx.changeAmount > 0;
                    const date = new Date(tx.timestamp);
                    return (
                      <div key={tx.id} className="timeline-item">
                        <div className="timeline-badge-col">
                          <span className={`timeline-badge-circle ${isCredit ? "credit" : "debit"}`}>
                            {isCredit ? "📥" : "📤"}
                          </span>
                          {index < filteredTransactions.length - 1 && <div className="timeline-connector-line"></div>}
                        </div>

                        <div className="timeline-content-box">
                          <div className="timeline-header-row">
                            <strong className="tx-description-label">{tx.description || tx.source}</strong>
                            <span className={`tx-amount-display ${isCredit ? "positive" : "negative"}`}>
                              {isCredit ? "+" : ""}₹{tx.changeAmount.toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="timeline-sub-row">
                            <span className="tx-time-stamp text-muted">
                              {date.toLocaleDateString()} at {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <span className="tx-audit-trail text-muted">
                              Bal: ₹{tx.beforeBalance.toFixed(2)} → ₹{tx.afterBalance.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="recharges-table-wrapper">
              {paymentRequests.length === 0 ? (
                <p className="empty-text text-center py-6 text-muted">No recharge requests submitted yet.</p>
              ) : (
                <table className="recharges-table">
                  <thead>
                    <tr>
                      <th>Submitted Date</th>
                      <th>Amount</th>
                      <th>Receipt screenshot</th>
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
                            View Screenshot 🔗
                          </a>
                        </td>
                        <td>
                          <span className={`badge status-badge-${req.status.toLowerCase()}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .wallet-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Hero Card Styling */
        .wallet-hero-card {
          background: linear-gradient(135deg, var(--primary-color) 0%, #0d4624 100%);
          border-radius: 12px;
          color: white;
          padding: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          box-shadow: 0 4px 15px rgba(26, 107, 60, 0.15);
        }

        .hero-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hero-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.85;
        }

        .hero-balance {
          font-size: 42px;
          font-weight: 800;
        }

        .hero-subtext {
          font-size: 13px;
          opacity: 0.9;
        }

        .low-bal-warning {
          color: var(--accent-color);
          font-weight: 600;
        }

        .recharge-btn {
          white-space: nowrap;
          padding: 12px 24px;
          font-size: 15px;
        }

        /* Analytics Grid */
        .wallet-analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }

        .analytics-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
        }

        .analytics-icon {
          font-size: 24px;
          width: 44px;
          height: 44px;
          background: var(--border-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .analytics-data {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .analytics-data strong {
          font-size: 18px;
          color: var(--text-main);
        }

        .analytics-data span {
          font-size: 12px;
        }

        /* Tabs Card Styling */
        .wallet-tabs-card {
          display: flex;
          flex-direction: column;
        }

        .tabs-header {
          display: flex;
          gap: 12px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .tab-btn {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          background: var(--border-light);
          color: var(--text-main);
        }

        .tab-btn.active {
          background: var(--primary-light);
          color: var(--primary-color);
          border-color: var(--primary-color);
          font-weight: 600;
        }

        /* Vertical timeline styling */
        .timeline-wrapper {
          display: flex;
          flex-direction: column;
        }

        .vertical-timeline {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-left: 8px;
        }

        .timeline-item {
          display: flex;
          gap: 16px;
        }

        .timeline-badge-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .timeline-badge-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          background: var(--border-light);
          z-index: 2;
        }

        .timeline-badge-circle.credit {
          background: var(--primary-light);
          color: var(--primary-color);
        }

        .timeline-badge-circle.debit {
          background: var(--danger-light);
          color: var(--danger-color);
        }

        .timeline-connector-line {
          position: absolute;
          top: 32px;
          bottom: -20px;
          width: 2px;
          background: var(--border-color);
          z-index: 1;
        }

        .timeline-content-box {
          flex: 1;
          background: var(--border-light);
          border: 1px solid var(--border-color);
          padding: 14px 16px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .timeline-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tx-description-label {
          font-size: 14px;
          color: var(--text-main);
        }

        .tx-amount-display {
          font-size: 15px;
          font-weight: 700;
        }

        .tx-amount-display.positive {
          color: var(--primary-color);
        }

        .tx-amount-display.negative {
          color: var(--danger-color);
        }

        .timeline-sub-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }

        /* Table styling for Recharges */
        .recharges-table-wrapper {
          overflow-x: auto;
        }

        .recharges-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 14px;
        }

        .recharges-table th, .recharges-table td {
          padding: 12px;
          border-bottom: 1px solid var(--border-light);
        }

        .recharges-table th {
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
        }

        .receipt-link {
          color: var(--primary-color);
          text-decoration: none;
          font-weight: 600;
          font-size: 13px;
        }

        .receipt-link:hover {
          text-decoration: underline;
        }

        /* Status badges */
        .status-badge-pending {
          background: var(--accent-light);
          color: #B25E00;
          font-size: 11px;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .status-badge-approved {
          background: var(--primary-light);
          color: var(--primary-color);
          font-size: 11px;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .status-badge-rejected {
          background: var(--danger-light);
          color: var(--danger-color);
          font-size: 11px;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .empty-text {
          font-size: 14px;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .wallet-hero-card {
            flex-direction: column;
            align-items: flex-start;
            padding: 20px;
          }
          .recharge-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
