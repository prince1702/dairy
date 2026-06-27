"use client";

import React, { useState } from "react";
import { completeDelivery } from "@/app/actions";

interface SubscriptionItem {
  product: {
    name: string;
    emoji: string;
    size: string;
    price: number;
  };
  quantity: number;
}

interface AssignedCustomer {
  id: string;
  name: string;
  address: string | null;
  sequence: number;
  subscriptionItems: SubscriptionItem[];
}

interface DeliveryDashboardProps {
  deliveryPersonId: string;
  route: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  customers: AssignedCustomer[];
}

export function DeliveryDashboardClient({
  deliveryPersonId,
  route,
  customers,
}: DeliveryDashboardProps) {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleComplete = async (customerId: string, customerName: string) => {
    setSubmittingId(customerId);
    setErrorMsg("");
    setSuccessInfo("");

    const res = await completeDelivery(deliveryPersonId, customerId);
    setSubmittingId(null);

    if (res.success) {
      setCompletedIds((prev) => [...prev, customerId]);
      setSuccessInfo(
        `Silent Delivery confirmed for ${customerName}! Wallet deducted by ₹${res.details?.totalCost.toFixed(
          2
        )} & Notification dispatched.`
      );
    } else {
      setErrorMsg(res.error || "Failed to mark delivery complete.");
    }
  };

  return (
    <main className="dashboard-main container">
      <section className="welcome-banner card mt-4">
        <h1>Delivery Route Sheet</h1>
        <p className="text-muted">Navigate your morning route, deliver dairy products, and trigger Silent Delivery updates.</p>
      </section>

      {successInfo && <div className="badge badge-success mt-4 block-alert">{successInfo}</div>}
      {errorMsg && <div className="badge badge-danger mt-4 block-alert">{errorMsg}</div>}

      <div className="dashboard-grid">
        {/* ROUTE INFO CARD */}
        <div className="card route-info-card mt-4">
          <div className="flex-between">
            <div>
              <h3>Assigned Route</h3>
              <p className="route-name mt-2">📍 {route ? route.name : "No Route Assigned"}</p>
              {route?.description && <p className="route-desc text-muted mt-1">{route.description}</p>}
            </div>
            <div className="stats-badge">
              <span className="stats-num">
                {customers.filter((c) => completedIds.includes(c.id)).length} / {customers.length}
              </span>
              <span className="stats-label">Completed</span>
            </div>
          </div>
        </div>

        {/* LOGISTICS CHECKLIST TABLE */}
        <div className="card checklist-card mt-4">
          <h3>Morning Delivery Checklist</h3>
          <p className="text-muted mb-4">Complete deliveries in sequence. Wallet deduction occurs instantly.</p>

          <div className="checklist-list mt-4">
            {customers.length === 0 ? (
              <p className="text-muted text-center py-8">No customers assigned to your route today.</p>
            ) : (
              customers.map((c) => {
                const isCompleted = completedIds.includes(c.id);

                return (
                  <div key={c.id} className={`checklist-item card ${isCompleted ? "completed" : ""}`}>
                    <div className="item-header flex-between">
                      <div className="item-seq-name">
                        <span className="seq-badge">#{c.sequence}</span>
                        <strong>{c.name}</strong>
                      </div>
                      <div>
                        {isCompleted ? (
                          <span className="badge badge-success">Delivered ✓</span>
                        ) : (
                          <button
                            onClick={() => handleComplete(c.id, c.name)}
                            disabled={submittingId === c.id}
                            className="btn btn-primary complete-btn"
                          >
                            {submittingId === c.id ? "Processing..." : "Mark Delivered"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="item-details mt-4">
                      <div className="detail-row">
                        <strong>Address:</strong> {c.address || "Not specified"}
                      </div>
                      <div className="detail-row mt-2">
                        <strong>Products:</strong>
                        <div className="products-checklist mt-1">
                          {c.subscriptionItems.length === 0 ? (
                            <span className="text-muted">No items in subscription</span>
                          ) : (
                            c.subscriptionItems.map((item, idx) => (
                              <span key={idx} className="product-badge">
                                {item.product.emoji} {item.quantity}x {item.product.name} ({item.product.size})
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
        .block-alert {
          display: block;
          text-align: center;
          padding: 10px;
        }

        /* Route Info custom styling */
        .route-name {
          font-weight: 700;
          font-size: 20px;
          color: var(--green);
        }
        .route-desc {
          font-size: 14px;
        }
        .stats-badge {
          text-align: center;
          background: var(--green-light);
          padding: 12px 20px;
          border-radius: var(--radius);
          border: 1px solid rgba(26, 107, 60, 0.2);
        }
        .stats-num {
          font-size: 24px;
          font-weight: 700;
          color: var(--green);
          display: block;
        }
        .stats-label {
          font-size: 11px;
          color: var(--muted);
          text-transform: uppercase;
        }

        /* Checklist specific styling */
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
          opacity: 0.7;
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
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
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

        @media (max-width: 900px) {
          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
