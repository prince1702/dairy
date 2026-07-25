"use client";

import React, { useState } from "react";

interface BaselineItem {
  productId: string;
  quantity: number;
  productName: string;
  productEmoji: string;
  productSize: string;
  productPrice: number;
}

interface TomorrowOverride {
  productId: string;
  quantity: number;
  productName: string;
  productEmoji: string;
  productSize: string;
  productPrice: number;
}

interface VacationRange {
  id: string;
  startDate: string;
  endDate: string;
}

interface PauseRecord {
  id: string;
  pauseDate: string;
}

interface DeliveryRecord {
  id: string;
  deliveredAt: Date;
  itemsSnapshot: string;
  totalCost: number;
  status: string;
  issueNote: string | null;
}

interface OrderHistoryClientViewProps {
  customer: {
    id: string;
    name: string;
    email: string;
  };
  subscriptionItems: BaselineItem[];
  tomorrowOverrides: TomorrowOverride[];
  isTomorrowPaused: boolean;
  vacations: VacationRange[];
  pauses: PauseRecord[];
  deliveries: DeliveryRecord[];
  products: {
    id: string;
    name: string;
    emoji: string;
    category: string;
    price: number;
    size: string;
  }[];
}

interface DisplayOrder {
  id: string;
  type: "BASELINE" | "TOMORROW" | "PAST" | "PAUSED";
  dateLabel: string;
  itemsCount: number;
  totalCost: number;
  statusLabel: string;
  statusType: "success" | "warning" | "danger" | "info";
  items: {
    name: string;
    emoji: string;
    quantity: number;
    size: string;
    price: number;
  }[];
  notes?: string | null;
}

export function OrderHistoryClientView({
  customer,
  subscriptionItems,
  tomorrowOverrides,
  isTomorrowPaused,
  vacations,
  pauses,
  deliveries,
  products,
}: OrderHistoryClientViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "BASELINE" | "TOMORROW" | "PAST" | "PAUSED">("ALL");
  const [selectedOrder, setSelectedOrder] = useState<DisplayOrder | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 6;

  // Let's build a unified display array
  const displayOrders: DisplayOrder[] = [];

  // 1. Add Daily Baseline as a persistent item
  if (subscriptionItems.length > 0) {
    const totalCost = subscriptionItems.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
    displayOrders.push({
      id: "baseline-schedule",
      type: "BASELINE",
      dateLabel: "Every Morning (Baseline)",
      itemsCount: subscriptionItems.reduce((sum, i) => sum + i.quantity, 0),
      totalCost,
      statusLabel: "Active Schedule",
      statusType: "success",
      items: subscriptionItems.map((i) => ({
        name: i.productName,
        emoji: i.productEmoji,
        quantity: i.quantity,
        size: i.productSize,
        price: i.productPrice,
      })),
    });
  }

  // 2. Add Tomorrow's Order Schedule
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const isTomorrowOnVacation = vacations.some((v) => {
    const start = new Date(v.startDate);
    const end = new Date(v.endDate);
    return tomorrow >= start && tomorrow <= end;
  });

  if (isTomorrowPaused || isTomorrowOnVacation) {
    displayOrders.push({
      id: "tomorrow-paused",
      type: "PAUSED",
      dateLabel: `Tomorrow: ${tomorrow.toLocaleDateString()}`,
      itemsCount: 0,
      totalCost: 0,
      statusLabel: isTomorrowPaused ? "Paused (Daily)" : "Paused (Vacation)",
      statusType: "danger",
      items: [],
    });
  } else {
    // Tomorrow's active items
    const tomorrowList: { name: string; emoji: string; quantity: number; size: string; price: number }[] = [];
    products.forEach((p) => {
      const override = tomorrowOverrides.find((o) => o.productId === p.id);
      if (override !== undefined) {
        if (override.quantity > 0) {
          tomorrowList.push({ name: p.name, emoji: p.emoji, quantity: override.quantity, size: p.size, price: p.price });
        }
      } else {
        const baseline = subscriptionItems.find((s) => s.productId === p.id);
        if (baseline && baseline.quantity > 0) {
          tomorrowList.push({ name: p.name, emoji: p.emoji, quantity: baseline.quantity, size: p.size, price: p.price });
        }
      }
    });

    if (tomorrowList.length > 0) {
      const totalCost = tomorrowList.reduce((sum, item) => sum + item.price * item.quantity, 0);
      displayOrders.push({
        id: "tomorrow-schedule",
        type: "TOMORROW",
        dateLabel: `Tomorrow: ${tomorrow.toLocaleDateString()}`,
        itemsCount: tomorrowList.reduce((sum, i) => sum + i.quantity, 0),
        totalCost,
        statusLabel: "Scheduled Tomorrow",
        statusType: "info",
        items: tomorrowList,
      });
    }
  }

  // 3. Add Completed Deliveries (Past orders)
  deliveries.forEach((d) => {
    let items: any[] = [];
    try {
      items = JSON.parse(d.itemsSnapshot);
    } catch (e) {}

    displayOrders.push({
      id: d.id,
      type: "PAST",
      dateLabel: new Date(d.deliveredAt).toLocaleDateString(),
      itemsCount: items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0),
      totalCost: d.totalCost,
      statusLabel: d.status === "DELIVERED" ? "Completed" : "Issue Reported",
      statusType: d.status === "DELIVERED" ? "success" : "danger",
      items: items.map((i: any) => ({
        name: i.name,
        emoji: "🥛", // default emoji
        quantity: i.quantity,
        size: i.size,
        price: i.price,
      })),
      notes: d.issueNote,
    });
  });

  // 4. Add Vacations & Pauses as cancelled history
  pauses.forEach((p) => {
    const pauseDate = new Date(p.pauseDate);
    // skip tomorrow pause because it's handled above
    if (pauseDate.getTime() !== tomorrow.getTime()) {
      displayOrders.push({
        id: p.id,
        type: "PAUSED",
        dateLabel: pauseDate.toLocaleDateString(),
        itemsCount: 0,
        totalCost: 0,
        statusLabel: "Skipped (Pause)",
        statusType: "danger",
        items: [],
      });
    }
  });

  vacations.forEach((v) => {
    displayOrders.push({
      id: v.id,
      type: "PAUSED",
      dateLabel: `${new Date(v.startDate).toLocaleDateString()} — ${new Date(v.endDate).toLocaleDateString()}`,
      itemsCount: 0,
      totalCost: 0,
      statusLabel: "Skipped (Vacation)",
      statusType: "danger",
      items: [],
    });
  });

  // Filter display orders
  const filteredOrders = displayOrders.filter((order) => {
    // 1. Search Query check
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === "" ||
      order.dateLabel.toLowerCase().includes(query) ||
      order.statusLabel.toLowerCase().includes(query) ||
      order.items.some((i) => i.name.toLowerCase().includes(query));

    // 2. Type Filter check
    const matchesType = filterType === "ALL" || order.type === filterType;

    return matchesSearch && matchesType;
  });

  // Pagination calculations
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredOrders.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredOrders.length / recordsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="orders-container">
      {/* Search & Filters Row */}
      <div className="orders-controls card">
        <div className="search-bar-col">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search orders by date, item name, or status..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="filters-tab-row">
          <button
            className={`filter-btn ${filterType === "ALL" ? "active" : ""}`}
            onClick={() => {
              setFilterType("ALL");
              setCurrentPage(1);
            }}
          >
            All Orders
          </button>
          <button
            className={`filter-btn ${filterType === "BASELINE" ? "active" : ""}`}
            onClick={() => {
              setFilterType("BASELINE");
              setCurrentPage(1);
            }}
          >
            Baseline Schedule
          </button>
          <button
            className={`filter-btn ${filterType === "TOMORROW" ? "active" : ""}`}
            onClick={() => {
              setFilterType("TOMORROW");
              setCurrentPage(1);
            }}
          >
            Tomorrow's Plan
          </button>
          <button
            className={`filter-btn ${filterType === "PAST" ? "active" : ""}`}
            onClick={() => {
              setFilterType("PAST");
              setCurrentPage(1);
            }}
          >
            Deliveries History
          </button>
          <button
            className={`filter-btn ${filterType === "PAUSED" ? "active" : ""}`}
            onClick={() => {
              setFilterType("PAUSED");
              setCurrentPage(1);
            }}
          >
            Paused/Skipped Days
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="orders-layout-grid">
        <div className="orders-list-panel">
          {currentRecords.length === 0 ? (
            <div className="card text-center py-8 text-muted">
              🔍 No matching order history records found.
            </div>
          ) : (
            <div className="grid-list">
              {currentRecords.map((order) => (
                <div
                  key={order.id}
                  className={`order-card-item card ${selectedOrder?.id === order.id ? "selected" : ""}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="order-item-header">
                    <span className="order-date-label">{order.dateLabel}</span>
                    <span className={`badge badge-${order.statusType}`}>
                      {order.statusLabel}
                    </span>
                  </div>

                  <div className="order-item-content">
                    {order.items.length === 0 ? (
                      <p className="paused-desc text-muted">No items scheduled (Delivery paused by user).</p>
                    ) : (
                      <div className="item-summary-box">
                        <span className="items-list-preview text-muted">
                          {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="order-item-footer">
                    <span className="text-muted">{order.itemsCount} Items</span>
                    <strong>₹{order.totalCost.toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-row">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn btn-outline page-nav-btn"
              >
                Previous
              </button>
              <div className="page-numbers">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => paginate(index + 1)}
                    className={`page-num-btn ${currentPage === index + 1 ? "active" : ""}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn btn-outline page-nav-btn"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Panel: Order Details Drawer */}
        <div className="order-details-panel">
          {selectedOrder ? (
            <div className="card details-sticky-card">
              <div className="details-header">
                <h3>Order Details</h3>
                <button className="close-details-btn" onClick={() => setSelectedOrder(null)}>✕</button>
              </div>

              <div className="details-meta mt-4">
                <div className="details-meta-row">
                  <span>Order Type:</span>
                  <strong>{selectedOrder.type}</strong>
                </div>
                <div className="details-meta-row">
                  <span>Date/Schedule:</span>
                  <strong>{selectedOrder.dateLabel}</strong>
                </div>
                <div className="details-meta-row">
                  <span>Status:</span>
                  <span className={`badge badge-${selectedOrder.statusType}`}>
                    {selectedOrder.statusLabel}
                  </span>
                </div>
                {selectedOrder.notes && (
                  <div className="details-meta-row issue-note">
                    <span>Issue Notes:</span>
                    <strong>{selectedOrder.notes}</strong>
                  </div>
                )}
              </div>

              <div className="details-divider"></div>

              <h4>Items Breakdown</h4>
              <div className="details-items-list mt-2">
                {selectedOrder.items.length === 0 ? (
                  <p className="text-muted text-center py-4">No items delivered.</p>
                ) : (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="details-item-row">
                      <div className="details-item-name">
                        <span>{item.emoji}</span>
                        <div>
                          <strong>{item.name}</strong>
                          <p className="text-muted" style={{ fontSize: "11px" }}>{item.size} • ₹{item.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <strong>x{item.quantity}</strong>
                    </div>
                  ))
                )}
              </div>

              <div className="details-divider"></div>

              <div className="details-footer">
                <span>Total Amount Charged:</span>
                <h2>₹{selectedOrder.totalCost.toFixed(2)}</h2>
              </div>
            </div>
          ) : (
            <div className="card details-empty-card text-center text-muted">
              🗂️ Select an order from the list on the left to see its full breakdown and status logs.
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .orders-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Search & filters */
        .orders-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .search-input {
          width: 100%;
        }

        .filters-tab-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          background: var(--border-light);
          color: var(--text-main);
        }

        .filter-btn.active {
          background: var(--primary-light);
          color: var(--primary-color);
          border-color: var(--primary-color);
          font-weight: 600;
        }

        /* Main layout grid */
        .orders-layout-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 32px;
          align-items: flex-start;
        }

        .orders-list-panel {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .grid-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .order-card-item {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border: 1px solid var(--border-color);
          transition: all 0.2s;
        }

        .order-card-item:hover {
          transform: translateY(-2px);
          border-color: var(--primary-color);
        }

        .order-card-item.selected {
          border-color: var(--primary-color);
          background: var(--primary-light);
        }

        .order-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .order-date-label {
          font-weight: 700;
          font-size: 14px;
        }

        .paused-desc {
          font-size: 12px;
          font-style: italic;
        }

        .items-list-preview {
          font-size: 13px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .order-item-footer {
          display: flex;
          justify-content: space-between;
          margin-top: auto;
          font-size: 14px;
          border-top: 1px solid var(--border-light);
          padding-top: 10px;
        }

        /* Pagination Styling */
        .pagination-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
        }

        .page-nav-btn {
          padding: 6px 12px;
          font-size: 12px;
        }

        .page-numbers {
          display: flex;
          gap: 6px;
        }

        .page-num-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          color: var(--text-main);
          cursor: pointer;
          font-weight: 600;
        }

        .page-num-btn.active {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        /* Details side drawer */
        .details-sticky-card {
          position: sticky;
          top: 94px;
        }

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .close-details-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 18px;
          cursor: pointer;
        }

        .details-meta {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .details-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .details-meta-row.issue-note {
          color: var(--danger-color);
          background: var(--danger-light);
          padding: 8px;
          border-radius: 6px;
          flex-direction: column;
          gap: 4px;
        }

        .details-divider {
          border-top: 1px solid var(--border-color);
          margin: 16px 0;
        }

        .details-items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 250px;
          overflow-y: auto;
        }

        .details-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }

        .details-item-name {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .details-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .details-footer span {
          font-size: 14px;
          color: var(--text-muted);
        }

        .details-footer h2 {
          color: var(--primary-color);
          font-weight: 800;
        }

        .details-empty-card {
          padding: 48px 24px;
          font-size: 13px;
          line-height: 1.6;
          border: 1px dashed var(--border-color);
          position: sticky;
          top: 94px;
        }

        @media (max-width: 900px) {
          .orders-layout-grid {
            grid-template-columns: 1fr;
          }
          .details-sticky-card, .details-empty-card {
            position: static;
            margin-top: 24px;
          }
        }

        @media (max-width: 600px) {
          .grid-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
