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
  timestamp: number;
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

  // View Switcher state
  const [viewMode, setViewMode] = useState<"CARD" | "TIMELINE" | "TABLE">("CARD");

  // Sorting state
  const [sortAscending, setSortAscending] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 6;

  // Compile unified display orders list
  const displayOrders: DisplayOrder[] = [];

  // 1. Add Daily Baseline
  if (subscriptionItems.length > 0) {
    const totalCost = subscriptionItems.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
    displayOrders.push({
      id: "baseline-schedule",
      type: "BASELINE",
      dateLabel: "Every Morning (Baseline)",
      timestamp: Date.now() + 1000 * 60 * 60 * 24 * 365, // far future for sorting
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
      timestamp: tomorrow.getTime(),
      itemsCount: 0,
      totalCost: 0,
      statusLabel: isTomorrowPaused ? "Paused (Daily)" : "Paused (Vacation)",
      statusType: "danger",
      items: [],
    });
  } else {
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
        timestamp: tomorrow.getTime(),
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
      timestamp: new Date(d.deliveredAt).getTime(),
      itemsCount: items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0),
      totalCost: d.totalCost,
      statusLabel: d.status === "DELIVERED" ? "Delivered" : "Issue Reported",
      statusType: d.status === "DELIVERED" ? "success" : "danger",
      items: items.map((i: any) => ({
        name: i.name,
        emoji: "🥛",
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
    if (pauseDate.getTime() !== tomorrow.getTime()) {
      displayOrders.push({
        id: p.id,
        type: "PAUSED",
        dateLabel: pauseDate.toLocaleDateString(),
        timestamp: pauseDate.getTime(),
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
      timestamp: new Date(v.startDate).getTime(),
      itemsCount: 0,
      totalCost: 0,
      statusLabel: "Skipped (Vacation)",
      statusType: "danger",
      items: [],
    });
  });

  // Filter and Sort display orders
  const filteredOrders = displayOrders
    .filter((order) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === "" ||
        order.dateLabel.toLowerCase().includes(query) ||
        order.statusLabel.toLowerCase().includes(query) ||
        order.items.some((i) => i.name.toLowerCase().includes(query));

      const matchesType = filterType === "ALL" || order.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      return sortAscending ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
    });

  // Pagination calculations
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredOrders.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredOrders.length / recordsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // CSV Exporter Action
  const exportToCSV = () => {
    const headers = ["Order ID", "Date/Schedule", "Order Type", "Items Breakdown", "Quantity Count", "Total Amount (INR)", "Status"];
    const rows = filteredOrders.map((o) => [
      o.id,
      o.dateLabel,
      o.type,
      o.items.map((i) => `${i.quantity}x ${i.name} (${i.size})`).join("; "),
      o.itemsCount,
      o.totalCost.toFixed(2),
      o.statusLabel,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.map((val) => `"${val}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bhagwati_Order_History_${customer.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="orders-container">
      {/* Search & Filters Controls Card */}
      <div className="orders-controls card">
        <div className="search-export-row">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search by date, product names, status..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          <button type="button" className="btn btn-outline csv-btn" onClick={exportToCSV} title="Export CSV report">
            📥 Export CSV
          </button>
        </div>

        <div className="filters-tab-row">
          <button className={`filter-btn ${filterType === "ALL" ? "active" : ""}`} onClick={() => { setFilterType("ALL"); setCurrentPage(1); }}>All Orders</button>
          <button className={`filter-btn ${filterType === "BASELINE" ? "active" : ""}`} onClick={() => { setFilterType("BASELINE"); setCurrentPage(1); }}>Baseline</button>
          <button className={`filter-btn ${filterType === "TOMORROW" ? "active" : ""}`} onClick={() => { setFilterType("TOMORROW"); setCurrentPage(1); }}>Tomorrow Plan</button>
          <button className={`filter-btn ${filterType === "PAST" ? "active" : ""}`} onClick={() => { setFilterType("PAST"); setCurrentPage(1); }}>Past Deliveries</button>
          <button className={`filter-btn ${filterType === "PAUSED" ? "active" : ""}`} onClick={() => { setFilterType("PAUSED"); setCurrentPage(1); }}>Paused/Skipped</button>
        </div>

        {/* View Switcher & Sorting Toolbar */}
        <div className="toolbar-row">
          <div className="view-mode-tabs">
            <button className={`view-tab-btn ${viewMode === "CARD" ? "active" : ""}`} onClick={() => setViewMode("CARD")}>🎴 Cards View</button>
            <button className={`view-tab-btn ${viewMode === "TIMELINE" ? "active" : ""}`} onClick={() => setViewMode("TIMELINE")}>📈 Timeline View</button>
            <button className={`view-tab-btn ${viewMode === "TABLE" ? "active" : ""}`} onClick={() => setViewMode("TABLE")}>📋 Table View</button>
          </div>

          <button
            type="button"
            className="btn btn-ghost sort-order-btn"
            onClick={() => setSortAscending(!sortAscending)}
          >
            {sortAscending ? "▲ Oldest First" : "▼ Newest First"}
          </button>
        </div>
      </div>

      {/* Main Grid: List on Left, Sticky details drawer on Right */}
      <div className="orders-layout-grid">
        <div className="orders-list-panel">
          {currentRecords.length === 0 ? (
            <div className="card text-center py-8 text-muted">
              🔍 No matching order records found.
            </div>
          ) : viewMode === "CARD" ? (
            /* Card Grid View Mode */
            <div className="grid-list-cards">
              {currentRecords.map((order) => (
                <div
                  key={order.id}
                  className={`order-card-item card ${selectedOrder?.id === order.id ? "selected" : ""}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="order-item-header">
                    <span className="order-date-label">{order.dateLabel}</span>
                    <span className={`badge badge-${order.statusType}`}>{order.statusLabel}</span>
                  </div>
                  <div className="order-item-content">
                    {order.items.length === 0 ? (
                      <p className="paused-desc text-muted">Skipped (Pause / Vacation scheduled)</p>
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
          ) : viewMode === "TIMELINE" ? (
            /* Vertical Step Timeline Mode */
            <div className="timeline-view-list card">
              <div className="vertical-timeline">
                {currentRecords.map((order, idx) => (
                  <div
                    key={order.id}
                    className={`timeline-node-item ${selectedOrder?.id === order.id ? "selected" : ""}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="timeline-indicator-col">
                      <span className={`timeline-dot-mark ${order.statusType}`}></span>
                      {idx < currentRecords.length - 1 && <div className="timeline-connector-bar"></div>}
                    </div>
                    <div className="timeline-content-card-box">
                      <div className="timeline-head-row">
                        <strong>{order.dateLabel}</strong>
                        <span className={`badge badge-${order.statusType}`}>{order.statusLabel}</span>
                      </div>
                      <p className="text-muted text-preview-timeline">
                        {order.items.length === 0 ? "Skipped pause day" : order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                      </p>
                      <div className="timeline-foot-row">
                        <span>Total amount: <strong>₹{order.totalCost.toFixed(2)}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Table list View Mode */
            <div className="table-view-card card">
              <div className="table-sticky-wrapper">
                <table className="orders-history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Order Type</th>
                      <th>Items Preview</th>
                      <th>Total Cost</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.map((order) => (
                      <tr
                        key={order.id}
                        className={`table-row-item ${selectedOrder?.id === order.id ? "selected" : ""}`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td><strong>{order.dateLabel}</strong></td>
                        <td><span className="type-meta">{order.type}</span></td>
                        <td>
                          <span className="table-preview-items text-muted">
                            {order.items.length === 0 ? "Skipped Pause" : order.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                          </span>
                        </td>
                        <td><strong>₹{order.totalCost.toFixed(2)}</strong></td>
                        <td>
                          <span className={`badge badge-${order.statusType}`}>{order.statusLabel}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Row */}
          {totalPages > 1 && (
            <div className="pagination-row">
              <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="btn btn-outline page-nav-btn">
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
              <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="btn btn-outline page-nav-btn">
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Expandable details drawer */}
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
                  <p className="text-muted text-center py-4">No items scheduled or delivered.</p>
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

        /* Controls */
        .orders-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .search-export-row {
          display: flex;
          gap: 12px;
        }

        .search-input {
          flex: 1;
        }

        .csv-btn {
          font-size: 13px;
          padding: 8px 16px;
          border-radius: 8px;
          white-space: nowrap;
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

        /* Toolbar view switcher */
        .toolbar-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border-color);
          padding-top: 12px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .view-mode-tabs {
          display: flex;
          background: var(--border-light);
          padding: 2px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .view-tab-btn {
          padding: 6px 12px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .view-tab-btn.active {
          background: var(--bg-card);
          color: var(--text-main);
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .sort-order-btn {
          font-size: 12px;
        }

        /* Grid layouts */
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

        /* Cards list */
        .grid-list-cards {
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

        /* Timeline list view */
        .timeline-view-list {
          padding: 24px;
        }

        .vertical-timeline {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .timeline-node-item {
          display: flex;
          gap: 16px;
          cursor: pointer;
        }

        .timeline-indicator-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .timeline-dot-mark {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--border-color);
          z-index: 2;
          margin-top: 6px;
        }

        .timeline-dot-mark.success { background: var(--primary-color); }
        .timeline-dot-mark.info { background: #3B82F6; }
        .timeline-dot-mark.danger { background: var(--danger-color); }
        .timeline-dot-mark.warning { background: var(--accent-color); }

        .timeline-connector-bar {
          position: absolute;
          top: 18px;
          bottom: -20px;
          width: 2px;
          background: var(--border-color);
          z-index: 1;
        }

        .timeline-content-card-box {
          flex: 1;
          background: var(--border-light);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: all 0.2s;
        }

        .timeline-node-item:hover .timeline-content-card-box,
        .timeline-node-item.selected .timeline-content-card-box {
          border-color: var(--primary-color);
          background: var(--primary-light);
        }

        .timeline-head-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .text-preview-timeline {
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .timeline-foot-row {
          font-size: 11px;
          margin-top: 2px;
        }

        /* Table view */
        .table-sticky-wrapper {
          overflow-x: auto;
        }

        .orders-history-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }

        .orders-history-table th, .orders-history-table td {
          padding: 12px;
          border-bottom: 1px solid var(--border-color);
        }

        .orders-history-table th {
          background: var(--border-light);
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.05em;
        }

        .table-row-item {
          cursor: pointer;
          transition: background 0.2s;
        }

        .table-row-item:hover {
          background: var(--border-light);
        }

        .table-row-item.selected {
          background: var(--primary-light);
          color: var(--primary-color);
        }

        .table-preview-items {
          max-width: 250px;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .type-meta {
          background: var(--border-light);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
        }

        /* Pagination */
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

        /* Side details */
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
          .grid-list-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
