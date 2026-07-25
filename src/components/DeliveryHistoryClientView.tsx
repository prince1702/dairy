"use client";

import React, { useState } from "react";

interface Delivery {
  id: string;
  deliveredAt: string;
  itemsSnapshot: string;
  totalCost: number;
  status: string;
  issueNote: string | null;
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
  // Client side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = deliveries.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(deliveries.length / recordsPerPage);

  return (
    <div className="delivery-container card">
      <div className="delivery-header">
        <h3>Delivery Logs & Silent Morning History</h3>
        <p className="text-muted">Review all completed daily morning silent deliveries, wallet charges, and reported issues.</p>
      </div>

      <div className="delivery-table-wrapper mt-4">
        {deliveries.length === 0 ? (
          <p className="empty-text text-center py-6 text-muted">No delivery history records found yet.</p>
        ) : (
          <>
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Delivery Time</th>
                  <th>Products Delivered</th>
                  <th>Total Cost</th>
                  <th>Delivery Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.map((del) => {
                  let items: any[] = [];
                  try {
                    items = JSON.parse(del.itemsSnapshot);
                  } catch (e) {}

                  const deliveredDate = new Date(del.deliveredAt);
                  const isIssue = del.status !== "DELIVERED";

                  return (
                    <tr key={del.id} className={isIssue ? "issue-row" : ""}>
                      <td>
                        <strong>{deliveredDate.toLocaleDateString()}</strong>
                      </td>
                      <td>
                        <span className="time-display">
                          🕒 {deliveredDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
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
                        <span className="delivery-type-badge">Silent Morning</span>
                      </td>
                      <td>
                        <span className={`badge badge-${isIssue ? "danger" : "success"}`}>
                          {isIssue ? "Issue Reported" : "Delivered ✓"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
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

        .delivery-header {
          margin-bottom: 16px;
        }

        .delivery-table-wrapper {
          overflow-x: auto;
        }

        .delivery-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 14px;
        }

        .delivery-table th, .delivery-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .delivery-table th {
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          background: var(--border-light);
        }

        .issue-row {
          background: rgba(239, 68, 68, 0.02);
        }

        .time-display {
          font-size: 13px;
          white-space: nowrap;
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
          font-size: 12px;
          font-weight: 500;
        }

        .issue-note-text {
          color: var(--danger-color);
          font-size: 11px;
          margin-top: 4px;
          font-weight: 600;
        }

        .cost-val {
          color: var(--text-main);
          font-size: 14px;
        }

        .delivery-type-badge {
          background: var(--primary-light);
          color: var(--primary-color);
          font-size: 11px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
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
