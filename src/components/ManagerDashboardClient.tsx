"use client";

import React, { useState } from "react";
import {
  approvePaymentRequest,
  rejectPaymentRequest,
  createRoute,
  updateRoute,
  deleteRoute,
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
  phone?: string | null;
  address?: string | null;
  status?: string | null;
  wallet: {
    balance: number;
  } | null;
  subscriptions?: { status: string }[];
  routeAssignments?: {
    id: string;
    route: { id: string; name: string };
    deliveryPerson: { id: string; name: string };
  }[];
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
  const [activeTab, setActiveTab] = useState<"payments" | "routes" | "customers">("payments");

  // Payment state
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Route Create state
  const [routeName, setRouteName] = useState("");
  const [routeDesc, setRouteDesc] = useState("");
  const [creatingRoute, setCreatingRoute] = useState(false);

  // Route Edit state
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [editRouteName, setEditRouteName] = useState("");
  const [editRouteDesc, setEditRouteDesc] = useState("");
  const [updatingRoute, setUpdatingRoute] = useState(false);
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);

  // Assignment state
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0]?.id || "");
  const [selectedCustomerId, setSelectedCustomerId] = useState(unassignedCustomers[0]?.id || "");
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState(deliveryPersons[0]?.id || "");
  const [sequence, setSequence] = useState("1");
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Search & Filter state for Customers
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRoute, setFilterRoute] = useState("ALL");
  const [filterDelivery, setFilterDelivery] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

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
    const res = await createRoute(routeName.trim(), routeDesc.trim());
    setCreatingRoute(false);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to create route.");
    } else {
      setSuccessMsg(`Route "${routeName}" created successfully!`);
      setRouteName("");
      setRouteDesc("");
    }
  };

  const handleStartEditRoute = (route: RouteItem) => {
    setEditingRouteId(route.id);
    setEditRouteName(route.name);
    setEditRouteDesc(route.description || "");
  };

  const handleCancelEditRoute = () => {
    setEditingRouteId(null);
    setEditRouteName("");
    setEditRouteDesc("");
  };

  const handleUpdateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRouteId || !editRouteName.trim()) return;
    setUpdatingRoute(true);
    setErrorMsg("");
    setSuccessMsg("");
    const res = await updateRoute(editingRouteId, editRouteName.trim(), editRouteDesc.trim());
    setUpdatingRoute(false);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to update route.");
    } else {
      setSuccessMsg(`Route updated successfully!`);
      setEditingRouteId(null);
    }
  };

  const handleDeleteRoute = async (routeId: string, routeName: string) => {
    if (!confirm(`Are you sure you want to delete route "${routeName}"? Customer assignments on this route will be removed cleanly.`)) {
      return;
    }
    setDeletingRouteId(routeId);
    setErrorMsg("");
    setSuccessMsg("");
    const res = await deleteRoute(routeId);
    setDeletingRouteId(null);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to delete route.");
    } else {
      setSuccessMsg(`Route "${routeName}" deleted successfully.`);
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

  // Filtered customer calculation
  const filteredCustomers = customers.filter((c) => {
    // 1. Search Query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = c.name.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchPhone = (c.phone || "").toLowerCase().includes(q);
      const matchAddress = (c.address || "").toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchAddress) return false;
    }

    // 2. Route Filter
    const customerRouteId = c.routeAssignments?.[0]?.route?.id;
    if (filterRoute === "UNASSIGNED") {
      if (customerRouteId) return false;
    } else if (filterRoute !== "ALL") {
      if (customerRouteId !== filterRoute) return false;
    }

    // 3. Delivery Person Filter
    const customerDeliveryId = c.routeAssignments?.[0]?.deliveryPerson?.id;
    if (filterDelivery !== "ALL") {
      if (customerDeliveryId !== filterDelivery) return false;
    }

    // 4. Status Filter
    const customerStatus = c.status || "ACTIVE";
    if (filterStatus !== "ALL") {
      if (customerStatus !== filterStatus) return false;
    }

    return true;
  });

  return (
    <main className="dashboard-main container">
      {/* Overview stats cards */}
      <section className="welcome-banner card mt-4">
        <h1>Manager Control Panel</h1>
        <p className="text-muted">Review payment recharge submissions, manage customer delivery routes, and assign delivery boys.</p>
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
        <button
          className={`tab-btn ${activeTab === "customers" ? "active" : ""}`}
          onClick={() => setActiveTab("customers")}
        >
          👥 Customer Directory
          <span className="tab-count">{customers.length}</span>
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

          {/* RIGHT COLUMN: PROCESSED HISTORY & QUICK CUSTOMER SHEET */}
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

            {/* Quick Customer Wallet Sheet */}
            <div className="card customer-sheet-card mt-4">
              <div className="flex-between">
                <h3>Customer Wallet Balances</h3>
                <button
                  onClick={() => setActiveTab("customers")}
                  className="btn btn-outline"
                  style={{ padding: "4px 10px", fontSize: "12px" }}
                >
                  View Full Directory →
                </button>
              </div>
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
                    {customers.slice(0, 8).map((c) => (
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
                    placeholder="e.g. Route A - Satellite & Vasna"
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
                    placeholder="e.g. Early morning delivery coverage for Zone 1"
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
                      <option key={r.id} value={r.id}>{r.name} ({r.assignments.length} customers)</option>
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
                      <option key={c.id} value={c.id}>🆕 {c.name} ({c.email})</option>
                    ))}
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>🔄 [Reassign] {c.name} ({c.email})</option>
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
                      <option key={dp.id} value={dp.id}>🚚 {dp.name}</option>
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
                  routes.map((route) => {
                    const isEditing = editingRouteId === route.id;
                    return (
                      <div key={route.id} className="route-block card" style={{ background: "var(--cream)", padding: "16px" }}>
                        {/* Header / Edit Form */}
                        {isEditing ? (
                          <form onSubmit={handleUpdateRoute} style={{ marginBottom: "12px" }}>
                            <div className="form-group mb-2">
                              <label className="form-label" style={{ fontSize: "12px" }}>Route Name</label>
                              <input
                                type="text"
                                className="form-input"
                                value={editRouteName}
                                onChange={(e) => setEditRouteName(e.target.value)}
                                required
                              />
                            </div>
                            <div className="form-group mb-2">
                              <label className="form-label" style={{ fontSize: "12px" }}>Description</label>
                              <input
                                type="text"
                                className="form-input"
                                value={editRouteDesc}
                                onChange={(e) => setEditRouteDesc(e.target.value)}
                              />
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button type="submit" className="btn btn-primary" style={{ padding: "4px 12px", fontSize: "12px" }} disabled={updatingRoute}>
                                {updatingRoute ? "Saving..." : "Save Changes"}
                              </button>
                              <button type="button" onClick={handleCancelEditRoute} className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "12px" }}>
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex-between mb-2">
                            <div>
                              <strong style={{ fontSize: "16px", color: "var(--green)" }}>📍 {route.name}</strong>
                              {route.description && (
                                <p className="text-muted mb-1" style={{ fontSize: "12px" }}>{route.description}</p>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span className="badge badge-info">{route.assignments.length} Customers</span>
                              <button
                                onClick={() => handleStartEditRoute(route)}
                                className="btn btn-outline"
                                style={{ padding: "3px 8px", fontSize: "11px" }}
                                title="Edit Route Name/Desc"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteRoute(route.id, route.name)}
                                disabled={deletingRouteId === route.id}
                                className="btn btn-outline"
                                style={{ padding: "3px 8px", fontSize: "11px", color: "#b91c1c", borderColor: "#fca5a5" }}
                                title="Delete Route"
                              >
                                {deletingRouteId === route.id ? "..." : "🗑️ Delete"}
                              </button>
                            </div>
                          </div>
                        )}

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
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CUSTOMER DIRECTORY & FILTERS TAB ─── */}
      {activeTab === "customers" && (
        <div className="card mt-4">
          <div className="flex-between mb-4">
            <div>
              <h3>All Customer Accounts & Route Status</h3>
              <p className="text-muted">Search customers and filter by Route, Delivery Boy, or Active Status.</p>
            </div>
            <div className="badge badge-info" style={{ fontSize: "13px" }}>
              Showing {filteredCustomers.length} of {customers.length} Customers
            </div>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="filter-bar mb-4" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px" }}>🔍 Search</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search name, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px" }}>📍 Route Filter</label>
              <select
                className="form-input"
                value={filterRoute}
                onChange={(e) => setFilterRoute(e.target.value)}
              >
                <option value="ALL">All Routes</option>
                <option value="UNASSIGNED">Unassigned Only</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px" }}>🚚 Delivery Boy Filter</label>
              <select
                className="form-input"
                value={filterDelivery}
                onChange={(e) => setFilterDelivery(e.target.value)}
              >
                <option value="ALL">All Delivery Boys</option>
                {deliveryPersons.map((dp) => (
                  <option key={dp.id} value={dp.id}>{dp.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px" }}>⚡ Account Status</label>
              <select
                className="form-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          {/* CUSTOMER DIRECTORY TABLE */}
          <div className="requests-table-wrapper">
            {filteredCustomers.length === 0 ? (
              <p className="text-muted text-center py-8">No matching customers found.</p>
            ) : (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Mobile Number</th>
                    <th>Address</th>
                    <th>Account Status</th>
                    <th>Subscription</th>
                    <th>Assigned Route</th>
                    <th>Delivery Boy</th>
                    <th>Wallet Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c) => {
                    const assignment = c.routeAssignments?.[0];
                    const subStatus = c.subscriptions?.[0]?.status || "NO_SUB";
                    const isLowBalance = (c.wallet?.balance || 0) < 50;

                    return (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.name}</strong>
                          <div className="text-muted" style={{ fontSize: "11px" }}>{c.email}</div>
                        </td>
                        <td>{c.phone || <span className="text-muted">N/A</span>}</td>
                        <td>{c.address || <span className="text-muted">N/A</span>}</td>
                        <td>
                          <span className={`badge badge-${(c.status || "ACTIVE") === "ACTIVE" ? "success" : "danger"}`}>
                            {c.status || "ACTIVE"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${subStatus === "ACTIVE" ? "success" : subStatus === "PAUSED" ? "warning" : "info"}`}>
                            {subStatus}
                          </span>
                        </td>
                        <td>
                          {assignment?.route?.name ? (
                            <span className="badge badge-info">📍 {assignment.route.name}</span>
                          ) : (
                            <span className="badge badge-warning" style={{ background: "#fef3c7", color: "#92400e" }}>Unassigned</span>
                          )}
                        </td>
                        <td>
                          {assignment?.deliveryPerson?.name ? (
                            <span>🚚 {assignment.deliveryPerson.name}</span>
                          ) : (
                            <span className="text-muted">Unassigned</span>
                          )}
                        </td>
                        <td>
                          <strong style={{ color: isLowBalance ? "var(--error)" : "var(--green)" }}>
                            ₹{c.wallet?.balance.toFixed(2) || "0.00"}
                          </strong>
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
          .filter-bar {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

