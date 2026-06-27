"use client";

import React, { useState } from "react";
import {
  approvePaymentRequest,
  rejectPaymentRequest,
  createRoute,
  assignCustomerToRoute,
  removeRouteAssignment,
} from "@/app/actions";

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

interface RouteAssignmentItem {
  id: string;
  sequence: number;
  customer: { id: string; name: string; email: string };
  deliveryPerson: { id: string; name: string; email: string };
}

interface RouteItem {
  id: string;
  name: string;
  description: string | null;
  assignments: RouteAssignmentItem[];
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface ManagerDashboardClientProps {
  managerId: string;
  pendingRequests: PaymentRequest[];
  processedRequests: PaymentRequest[];
  customers: Customer[];
  routes?: RouteItem[];
  deliveryPersons?: UserOption[];
  unassignedCustomers?: UserOption[];
}

export function ManagerDashboardClient({
  managerId,
  pendingRequests,
  processedRequests,
  customers,
  routes = [],
  deliveryPersons = [],
  unassignedCustomers = [],
}: ManagerDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"payments" | "routes">("payments");

  // Payment state
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Route state
  const [routeName, setRouteName] = useState("");
  const [routeDesc, setRouteDesc] = useState("");
  const [creatingRoute, setCreatingRoute] = useState(false);

  // Assignment state
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0]?.id || "");
  const [selectedCustomerId, setSelectedCustomerId] = useState(unassignedCustomers[0]?.id || "");
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState(deliveryPersons[0]?.id || "");
  const [sequence, setSequence] = useState("1");
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleApprove = async (requestId: string) => {
    setSubmittingId(requestId);
    setErrorMsg("");
    setSuccessMsg("");
    const res = await approvePaymentRequest(requestId, managerId);
    setSubmittingId(null);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to approve payment request.");
    } else {
      setSuccessMsg("Payment request approved successfully!");
    }
  };

  const handleReject = async (requestId: string) => {
    setSubmittingId(requestId);
    setErrorMsg("");
    setSuccessMsg("");
    const res = await rejectPaymentRequest(requestId, managerId);
    setSubmittingId(null);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to reject payment request.");
    } else {
      setSuccessMsg("Payment request rejected.");
    }
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName.trim()) return;
    setCreatingRoute(true);
    setErrorMsg("");
    setSuccessMsg("");
    const res = await createRoute(routeName, routeDesc);
    setCreatingRoute(false);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to create route.");
    } else {
      setSuccessMsg(`Route "${routeName}" created successfully!`);
      setRouteName("");
      setRouteDesc("");
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouteId || !selectedCustomerId || !selectedDeliveryPersonId) {
      setErrorMsg("Please select a route, customer, and delivery person.");
      return;
    }
    setAssigning(true);
    setErrorMsg("");
    setSuccessMsg("");
    const res = await assignCustomerToRoute(selectedRouteId, selectedCustomerId, selectedDeliveryPersonId, Number(sequence) || 0);
    setAssigning(false);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to assign route.");
    } else {
      setSuccessMsg("Customer assigned to route successfully!");
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    setRemovingId(assignmentId);
    setErrorMsg("");
    setSuccessMsg("");
    const res = await removeRouteAssignment(assignmentId);
    setRemovingId(null);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to remove route assignment.");
    } else {
      setSuccessMsg("Route assignment removed.");
    }
  };

  return (
    <main className="dashboard-main container">
      {/* Overview stats cards */}
      <section className="welcome-banner card mt-4">
        <h1>Manager Control Panel</h1>
        <p className="text-muted">Review payment recharge submissions, verify bank transaction receipts, and manage customer route assignments.</p>
      </section>

      {/* Navigation Tabs */}
      <div className="tab-bar mt-4">
        <button
          className={`tab-btn ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          💳 Payment Verification
          {pendingRequests.length > 0 && <span className="tab-count warning">{pendingRequests.length}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === "routes" ? "active" : ""}`}
          onClick={() => setActiveTab("routes")}
        >
          🚚 Route & Assignment Management
          <span className="tab-count">{routes.length}</span>
        </button>
      </div>

      {errorMsg && <div className="badge badge-danger mt-4 block-alert">{errorMsg}</div>}
      {successMsg && <div className="badge badge-success mt-4 block-alert">{successMsg}</div>}

      {/* ─── PAYMENT VERIFICATION TAB ─── */}
      {activeTab === "payments" && (
        <div className="dashboard-grid mt-4">
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
                          disabled={submittingId === req.id}
                          className="btn btn-primary"
                          style={{ flex: 1 }}
                        >
                          {submittingId === req.id ? "Processing..." : "Approve & Credit"}
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={submittingId === req.id}
                          className="btn btn-outline reject-btn"
                          style={{ flex: 1 }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PROCESSED HISTORY & CUSTOMERS */}
          <div className="grid-column">
            {/* Processed requests */}
            <div className="card processed-card">
              <h3>Processed Verification Logs</h3>
              <div className="requests-table-wrapper mt-4">
                {processedRequests.length === 0 ? (
                  <p className="text-muted text-center py-4">No processed logs yet.</p>
                ) : (
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedRequests.map((req) => (
                        <tr key={req.id}>
                          <td>{req.customer.name}</td>
                          <td>₹{req.amount.toFixed(2)}</td>
                          <td>
                            <span className={`badge badge-${req.status === "APPROVED" ? "success" : "danger"}`}>
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

            {/* Customers Wallet Balance Sheet */}
            <div className="card customer-sheet-card mt-4">
              <h3>Customer Account Sheets</h3>
              <div className="requests-table-wrapper mt-4">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Wallet Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id}>
                        <td>{c.name}</td>
                        <td className="text-muted">{c.email}</td>
                        <td>
                          <strong style={{ color: (c.wallet?.balance || 0) < 50 ? "var(--error)" : "var(--green)" }}>
                            ₹{c.wallet?.balance.toFixed(2) || "0.00"}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ROUTE & ASSIGNMENT MANAGEMENT TAB ─── */}
      {activeTab === "routes" && (
        <div className="dashboard-grid mt-4">
          {/* LEFT COLUMN: CREATE ROUTE & ASSIGNMENT FORMS */}
          <div className="grid-column">
            {/* Create Route Form */}
            <div className="card">
              <h3>Create New Delivery Route</h3>
              <p className="text-muted mb-4">Add a new geographical zone or route for morning deliveries.</p>
              <form onSubmit={handleCreateRoute}>
                <div className="form-group mb-3">
                  <label className="form-label">Route Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Route B - Navrangpura & Ashram Road"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Early morning delivery coverage for Zone 2"
                    value={routeDesc}
                    onChange={(e) => setRouteDesc(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={creatingRoute}>
                  {creatingRoute ? "Creating..." : "+ Create Route"}
                </button>
              </form>
            </div>

            {/* Assign Customer to Route Form */}
            <div className="card mt-4">
              <h3>Assign Customer to Route</h3>
              <p className="text-muted mb-4">Link a customer and delivery person to a specific route with sequence.</p>
              <form onSubmit={handleAssign}>
                <div className="form-group mb-3">
                  <label className="form-label">Select Route</label>
                  <select
                    className="form-input"
                    value={selectedRouteId}
                    onChange={(e) => setSelectedRouteId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Route --</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Select Customer</label>
                  <select
                    className="form-input"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Customer --</option>
                    {unassignedCustomers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                    ))}
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>[Reassign] {c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Select Delivery Person</label>
                  <select
                    className="form-input"
                    value={selectedDeliveryPersonId}
                    onChange={(e) => setSelectedDeliveryPersonId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Delivery Person --</option>
                    {deliveryPersons.map((dp) => (
                      <option key={dp.id} value={dp.id}>{dp.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Sequence Number</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="1"
                    value={sequence}
                    onChange={(e) => setSequence(e.target.value)}
                    min="1"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={assigning}>
                  {assigning ? "Assigning..." : "Assign to Route"}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: EXISTING ROUTES & ASSIGNMENTS TABLE */}
          <div className="grid-column">
            <div className="card">
              <h3>Existing Routes & Route Assignments</h3>
              <p className="text-muted mb-4">Current customer assignments grouped by delivery route.</p>

              <div className="routes-list" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {routes.length === 0 ? (
                  <p className="text-muted text-center py-8">No routes created yet.</p>
                ) : (
                  routes.map((route) => (
                    <div key={route.id} className="route-block card" style={{ background: "var(--cream)", padding: "16px" }}>
                      <div className="flex-between mb-2">
                        <strong style={{ fontSize: "16px", color: "var(--green)" }}>📍 {route.name}</strong>
                        <span className="badge badge-info">{route.assignments.length} Customers</span>
                      </div>
                      {route.description && <p className="text-muted mb-3" style={{ fontSize: "12px" }}>{route.description}</p>}

                      <div className="requests-table-wrapper">
                        {route.assignments.length === 0 ? (
                          <p className="text-muted" style={{ fontSize: "12px", fontStyle: "italic", padding: "8px 0" }}>No customers assigned to this route yet.</p>
                        ) : (
                          <table className="dashboard-table" style={{ fontSize: "13px" }}>
                            <thead>
                              <tr>
                                <th>Seq</th>
                                <th>Customer</th>
                                <th>Delivery Person</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {route.assignments.map((a) => (
                                <tr key={a.id}>
                                  <td><strong>#{a.sequence}</strong></td>
                                  <td>{a.customer.name}</td>
                                  <td>{a.deliveryPerson.name}</td>
                                  <td>
                                    <button
                                      onClick={() => handleRemoveAssignment(a.id)}
                                      disabled={removingId === a.id}
                                      className="btn btn-outline"
                                      style={{ padding: "4px 8px", fontSize: "11px", color: "#b91c1c", borderColor: "#fca5a5" }}
                                    >
                                      {removingId === a.id ? "..." : "Remove"}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
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
          margin-bottom: 8px;
        }
        .block-alert {
          display: block;
          text-align: center;
          padding: 10px;
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
        .tab-count.warning {
          background: #fee2e2;
          color: #b91c1c;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
        }
        .grid-column {
          display: flex;
          flex-direction: column;
        }

        /* Pending verification items */
        .requests-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .pending-item {
          background: var(--cream);
        }
        .pending-item .amount {
          font-size: 20px;
          font-weight: 700;
          color: var(--green);
        }
        .pending-item .email {
          font-size: 13px;
        }
        .screenshot-preview {
          background: var(--white);
          padding: 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          text-align: center;
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
