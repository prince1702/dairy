"use client";

import React, { useState } from "react";

interface Delivery {
  id: string;
  deliveredAt: string;
  itemsSnapshot: string;
  totalCost: number;
  status: string;
  issueNote: string | null;
  deliveryPersonName: string;
  deliveryPersonPhone: string;
}

interface DeliveryHistoryClientViewProps {
  customer: {
    id: string;
    name: string;
    email: string;
  };
  deliveries: Delivery[];
}

export function DeliveryHistoryClientView({
  customer,
  deliveries,
}: DeliveryHistoryClientViewProps) {
  // Search and Sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Client side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Filter & Sort
  const filteredDeliveries = deliveries
    .filter((del) => {
      const query = searchQuery.toLowerCase().trim();
      const dateStr = new Date(del.deliveredAt).toLocaleDateString().toLowerCase();
      const nameStr = del.deliveryPersonName.toLowerCase();
      const statusStr = del.status.toLowerCase();
      return (
        query === "" ||
        dateStr.includes(query) ||
        nameStr.includes(query) ||
        statusStr.includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        const timeA = new Date(a.deliveredAt).getTime();
        const timeB = new Date(b.deliveredAt).getTime();
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
      } else {
        return sortOrder === "desc" ? b.totalCost - a.totalCost : a.totalCost - b.totalCost;
      }
    });

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredDeliveries.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredDeliveries.length / recordsPerPage);

  const toggleSort = (field: "date" | "amount") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  // CSV Exporter Action
  const exportDeliveriesCSV = () => {
    const headers = ["Delivery ID", "Delivery Date", "Delivery Time", "Courier Name", "Courier Phone", "Items List", "Total cost (INR)", "Status", "Notes"];
    const rows = filteredDeliveries.map((del) => {
      let items: any[] = [];
      try { items = JSON.parse(del.itemsSnapshot); } catch (e) {}
      return [
        del.id,
        new Date(del.deliveredAt).toLocaleDateString(),
        new Date(del.deliveredAt).toLocaleTimeString(),
        del.deliveryPersonName,
        del.deliveryPersonPhone,
        items.map((i) => `${i.quantity}x ${i.name} (${i.size})`).join("; "),
        del.totalCost.toFixed(2),
        del.status,
        del.issueNote || "",
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.map((val) => `"${val}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bhagwati_Deliveries_Export_${customer.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="delivery-container card">
      <div className="delivery-header-row">
        <div>
          <h3>Delivery Logs & Silent Morning History</h3>
          <p className="text-muted">Browse historical transactions, courier names, and silent morning drops.</p>
        </div>
        <button type="button" className="btn btn-outline csv-btn" onClick={exportDeliveriesCSV} title="Export CSV log">
          📥 Download CSV
        </button>
      </div>

      {/* Controls: Search, Sort */}
      <div className="delivery-controls mt-4">
        <input
          type="text"
          placeholder="Search by date, courier name, status..."
          className="form-input search-delivery-input"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />

        <div className="sort-buttons-row">
          <button
            type="button"
            className={`btn btn-outline sort-action-btn ${sortBy === "date" ? "active" : ""}`}
            onClick={() => toggleSort("date")}
          >
            Sort Date {sortBy === "date" ? (sortOrder === "desc" ? "▼" : "▲") : ""}
          </button>
          <button
            type="button"
            className={`btn btn-outline sort-action-btn ${sortBy === "amount" ? "active" : ""}`}
            onClick={() => toggleSort("amount")}
          >
            Sort Cost {sortBy === "amount" ? (sortOrder === "desc" ? "▼" : "▲") : ""}
          </button>
        </div>
      </div>

      <div className="delivery-table-wrapper mt-4">
        {filteredDeliveries.length === 0 ? (
          <p className="empty-text text-center py-6 text-muted">No delivery history records found matching your filters.</p>
        ) : (
          <>
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>Delivery Date</th>
                  <th>Delivery Time</th>
                  <th>Courier / Delivered By</th>
                  <th>Products Delivered</th>
                  <th>Cost Charged</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.map((del) => {
                  let items: any[] = [];
                  try { items = JSON.parse(del.itemsSnapshot); } catch (e) {}

                  const deliveredDate = new Date(del.deliveredAt);
                  const isIssue = del.status !== "DELIVERED";

                  return (
                    <tr key={del.id} className={isIssue ? "issue-row" : ""}>
                      <td>
                        <strong>{deliveredDate.toLocaleDateString()}</strong>
                      </td>
                      <td>
                        <span className="time-val">
                          🕒 {deliveredDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td>
                        <div className="courier-details-box">
                          <strong>🧑‍✈️ {del.deliveryPersonName}</strong>
                          {del.deliveryPersonPhone && (
                            <span className="courier-phone text-muted">{del.deliveryPersonPhone}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="products-list-snapshot">
                          {items.length > 0 ? (
                            items.map((i, idx) => (
                              <span key={idx} className="snapshot-item">
                                {i.quantity}x {i.name} ({i.size})
                              </span>
                            ))
                          ) : (
                            <span className="no-items text-muted">No items list</span>
                          )}
                        </div>
                        {del.issueNote && (
                          <div className="issue-note-text">
                            ⚠️ Note: {del.issueNote}
                          </div>
                        )}
                      </td>
                      <td>
                        <strong className="cost-val">₹{del.totalCost.toFixed(2)}</strong>
                      </td>
                      <td>
                        <div className="status-badge-column">
                          <span className={`badge badge-${isIssue ? "danger" : "success"}`}>
                            {isIssue ? "Issue Reported" : "Delivered ✓"}
                          </span>
                          <span className="silent-drop-label">Silent Morning Drop</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-row">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-outline btn-sm"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn btn-outline btn-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .delivery-container {
          display: flex;
          flex-direction: column;
        }

        .delivery-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
        }

        .csv-btn {
          font-size: 13px;
          padding: 8px 16px;
          border-radius: 8px;
        }

        /* Controls row styling */
        .delivery-controls {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .search-delivery-input {
          flex: 1;
          min-width: 250px;
        }

        .sort-buttons-row {
          display: flex;
          gap: 8px;
        }

        .sort-action-btn {
          padding: 8px 16px;
          font-size: 12px;
          border-radius: 8px;
        }

        .sort-action-btn.active {
          background: var(--primary-light);
          color: var(--primary-color);
          border-color: var(--primary-color);
        }

        .delivery-table-wrapper {
          overflow-x: auto;
        }

        .delivery-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }

        .delivery-table th, .delivery-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }

        .delivery-table th {
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.05em;
          background: var(--border-light);
        }

        .issue-row {
          background: rgba(239, 68, 68, 0.02);
        }

        .time-val {
          font-size: 12px;
          white-space: nowrap;
        }

        /* Courier details box */
        .courier-details-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .courier-phone {
          font-size: 11px;
        }

        .products-list-snapshot {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .snapshot-item {
          background: var(--border-light);
          color: var(--text-main);
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
        }

        .issue-note-text {
          color: var(--danger-color);
          font-size: 11px;
          margin-top: 6px;
          font-weight: 600;
        }

        .cost-val {
          color: var(--text-main);
          font-size: 14px;
        }

        .status-badge-column {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: flex-start;
        }

        .silent-drop-label {
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--primary-color);
          letter-spacing: 0.05em;
        }

        .page-info {
          font-size: 13px;
          color: var(--text-muted);
        }

        .pagination-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding: 12px 0;
        }

        .empty-text {
          font-size: 14px;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
