"use client";

import React, { useState } from "react";
import { approvePaymentRequest, rejectPaymentRequest } from "@/app/actions";

interface PaymentRequest {
  id: string;
  amount: number;
  screenshotUrl: string;
  status: string;
  createdAt: Date;
  customer: {
    name: string;
    email: string;
  };
}

interface Customer {
  id: string;
  name: string;
  email: string;
  address: string | null;
  wallet: {
    balance: number;
  } | null;
}

interface ManagerDashboardClientProps {
  managerId: string;
  pendingRequests: PaymentRequest[];
  processedRequests: PaymentRequest[];
  customers: Customer[];
}

export function ManagerDashboardClient({
  managerId,
  pendingRequests,
  processedRequests,
  customers,
}: ManagerDashboardClientProps) {
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleApprove = async (requestId: string) => {
    setSubmittingId(requestId);
    setErrorMsg("");
    const res = await approvePaymentRequest(requestId, managerId);
    setSubmittingId(null);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to approve payment request.");
    }
  };

  const handleReject = async (requestId: string) => {
    setSubmittingId(requestId);
    setErrorMsg("");
    const res = await rejectPaymentRequest(requestId, managerId);
    setSubmittingId(null);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to reject payment request.");
    }
  };

  return (
    <main className="dashboard-main container">
      {/* Overview stats cards */}
      <section className="welcome-banner card mt-4">
        <h1>Manager Control Panel</h1>
        <p className="text-muted">Review payment recharge submissions, verify bank transaction receipts, and manage customer account sheets.</p>
      </section>

      {errorMsg && <div className="badge badge-danger mt-4 block-alert">{errorMsg}</div>}

      <div className="dashboard-grid">
        {/* LEFT COLUMN: PENDING REQUESTS SCREENSHOT VERIFICATION */}
        <div className="grid-column">
          <div className="card pending-card">
            <h3>Pending Recharge Verification Requests</h3>
            <p className="text-muted mb-4">Verify the transaction screenshot before approving.</p>

            <div className="requests-list">
              {pendingRequests.length === 0 ? (
                <p className="text-muted text-center py-8">No pending verifications.</p>
              ) : (
                pendingRequests.map((req) => (
                  <div key={req.id} className="pending-item card">
                    <div className="flex-between">
                      <div>
                        <strong>{req.customer.name}</strong>
                        <div className="email text-muted">{req.customer.email}</div>
                      </div>
                      <div className="amount">₹{req.amount.toFixed(2)}</div>
                    </div>
                    <div className="screenshot-preview mt-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={req.screenshotUrl} alt="Transaction Receipt" className="receipt-img" />
                      <a href={req.screenshotUrl} target="_blank" rel="noreferrer" className="btn btn-outline view-full-btn mt-2">
                        View Full Size 🔗
                      </a>
                    </div>
                    <div className="action-buttons mt-4">
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="btn btn-primary"
                        disabled={submittingId === req.id}
                      >
                        {submittingId === req.id ? "Processing..." : "Approve & Credit Wallet"}
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="btn btn-ghost reject-btn"
                        disabled={submittingId === req.id}
                      >
                        Reject Request
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PROCESSED REQUESTS HISTORY */}
          <div className="card processed-card mt-4">
            <h3>Processed Recharge History</h3>
            <div className="requests-table-wrapper mt-4">
              {processedRequests.length === 0 ? (
                <p className="text-muted text-center py-4">No history records.</p>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedRequests.map((req) => (
                      <tr key={req.id}>
                        <td>{req.customer.name}</td>
                        <td><strong>₹{req.amount.toFixed(2)}</strong></td>
                        <td>
                          <span className={`badge badge-${req.status === "APPROVED" ? "success" : "danger"}`}>
                            {req.status}
                          </span>
                        </td>
                        <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CUSTOMER BALANCE SHEET */}
        <div className="grid-column">
          <div className="card customer-sheet-card">
            <h3>Customer Balances & Address Sheet</h3>
            <p className="text-muted mb-4">Monitor prepaid balances and delivery logistics address records.</p>

            <div className="requests-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Wallet Balance</th>
                    <th>Delivery Address</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                        <div className="text-muted" style={{ fontSize: "11px" }}>{c.email}</div>
                      </td>
                      <td>
                        <span className={`badge badge-${(c.wallet?.balance ?? 0) > 50 ? "success" : "danger"}`}>
                          ₹{c.wallet?.balance.toFixed(2) ?? "0.00"}
                        </span>
                      </td>
                      <td style={{ fontSize: "12px", maxHeight: "80px", overflow: "hidden" }}>
                        {c.address || <span className="text-muted">Not specified</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
        .block-alert {
          display: block;
          text-align: center;
          padding: 10px;
        }

        /* Pending Request specific style */
        .pending-item {
          background: var(--cream);
          margin-bottom: 16px;
        }
        .pending-item .amount {
          font-size: 20px;
          font-weight: 700;
          color: var(--green);
        }
        .screenshot-preview {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .receipt-img {
          max-width: 100%;
          max-height: 250px;
          object-fit: contain;
          border-radius: 4px;
        }
        .view-full-btn {
          width: 100%;
          text-align: center;
          font-size: 12px;
          padding: 6px 12px;
        }
        .action-buttons {
          display: flex;
          gap: 12px;
        }
        .reject-btn {
          color: var(--error);
          border: 1px solid var(--error);
        }
        .reject-btn:hover {
          background: #fee2e2;
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
