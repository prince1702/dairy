"use client";

import React, { useState } from "react";
import { upsertOrderOverride, toggleTomorrowPause } from "@/app/actions";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  emoji: string;
  category: string;
  price: number;
  size: string;
}

interface TomorrowChangesClientViewProps {
  customer: {
    id: string;
    name: string;
    email: string;
  };
  products: Product[];
  subscriptionItems: { productId: string; quantity: number }[];
  tomorrowOverrides: { productId: string; quantity: number }[];
  isTomorrowPaused: boolean;
  vacations: { id: string; startDate: string; endDate: string }[];
}

export function TomorrowChangesClientView({
  customer,
  products,
  subscriptionItems,
  tomorrowOverrides,
  isTomorrowPaused,
  vacations,
}: TomorrowChangesClientViewProps) {
  const router = useRouter();

  // Tomorrow's Override State
  const [tomorrowPause, setTomorrowPause] = useState(isTomorrowPaused);
  const [overrideQuantities, setOverrideQuantities] = useState<Record<string, number>>(() => {
    const quantities: Record<string, number> = {};
    products.forEach((p) => {
      const override = tomorrowOverrides.find((item) => item.productId === p.id);
      if (override !== undefined) {
        quantities[p.id] = override.quantity;
      } else {
        const recurring = subscriptionItems.find((item) => item.productId === p.id);
        quantities[p.id] = recurring ? recurring.quantity : 0;
      }
    });
    return quantities;
  });

  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState(false);
  const [overrideError, setOverrideError] = useState("");
  const [pauseSubmitting, setPauseSubmitting] = useState(false);

  // Cutoff time helper (10:00 PM local time today)
  const isCutoffPassed = () => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setHours(22, 0, 0, 0);
    return now.getTime() > cutoff.getTime();
  };

  const isTomorrowOnVacation = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return vacations.some((v) => {
      const start = new Date(v.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(v.endDate);
      end.setHours(0, 0, 0, 0);
      return tomorrow >= start && tomorrow <= end;
    });
  };

  const handleOverrideQtyChange = (productId: string, val: number) => {
    setOverrideQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOverrideSubmitting(true);
    setOverrideSuccess(false);
    setOverrideError("");

    if (isCutoffPassed()) {
      setOverrideError("Cutoff time (10:00 PM) has passed. Tomorrow's order cannot be modified.");
      setOverrideSubmitting(false);
      return;
    }

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      let hasError = false;
      let errorMsg = "";

      for (const p of products) {
        const recurring = subscriptionItems.find((item) => item.productId === p.id);
        const recurringQty = recurring ? recurring.quantity : 0;
        const currentQty = overrideQuantities[p.id];

        // Save override if it differs from the recurring subscription quantity
        if (currentQty !== recurringQty) {
          const res = await upsertOrderOverride(customer.id, p.id, currentQty, tomorrowStr);
          if (!res.success) {
            hasError = true;
            errorMsg = res.error || `Failed to save override for ${p.name}.`;
          }
        }
      }

      if (!hasError) {
        setOverrideSuccess(true);
        router.refresh();
        setTimeout(() => setOverrideSuccess(false), 3000);
      } else {
        setOverrideError(errorMsg);
      }
    } catch (err: any) {
      setOverrideError(err.message || "An error occurred.");
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const handlePauseToggle = async () => {
    setPauseSubmitting(true);
    setOverrideError("");
    setOverrideSuccess(false);

    if (isCutoffPassed()) {
      setOverrideError("Cutoff time (10:00 PM) has passed. Tomorrow's pause status cannot be modified.");
      setPauseSubmitting(false);
      return;
    }

    const nextState = !tomorrowPause;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    try {
      const res = await toggleTomorrowPause(customer.id, tomorrowStr, nextState);
      setPauseSubmitting(false);

      if (res.success) {
        setTomorrowPause(nextState);
        setOverrideSuccess(true);
        router.refresh();
        setTimeout(() => setOverrideSuccess(false), 3000);
      } else {
        setOverrideError(res.error || "Failed to update pause status.");
      }
    } catch (err: any) {
      setPauseSubmitting(false);
      setOverrideError(err.message || "An error occurred.");
    }
  };

  // Get what items will be delivered tomorrow
  const getTomorrowActiveItems = () => {
    if (tomorrowPause) return [];
    if (isTomorrowOnVacation()) return [];

    return products
      .map((p) => {
        const qty = overrideQuantities[p.id];
        const baseline = subscriptionItems.find((s) => s.productId === p.id)?.quantity || 0;
        const isModified = qty !== baseline;
        return {
          ...p,
          qty,
          isModified,
        };
      })
      .filter((p) => p.qty > 0);
  };

  const tomorrowActiveItems = getTomorrowActiveItems();
  const tomorrowTotalCost = tomorrowActiveItems.reduce((sum, p) => sum + p.price * p.qty, 0);

  return (
    <div className="tomorrow-container">
      <div className="tomorrow-grid">
        {/* Left Form Panel */}
        <div className="tomorrow-form-panel card">
          <div className="tomorrow-header">
            <h3>One-Day Quantities Override</h3>
            <p className="text-muted">Modify quantities for tomorrow's delivery only. Baseline subscription remains unchanged.</p>
          </div>

          {/* Cutoff Time Warning Banner */}
          <div className={`cutoff-banner ${isCutoffPassed() ? "passed" : "active"}`}>
            <span className="banner-icon">{isCutoffPassed() ? "🔒" : "🔓"}</span>
            <div>
              <strong>Daily Cutoff Time: 10:00 PM</strong>
              <p>{isCutoffPassed() ? "Tomorrow's delivery is locked." : "Tomorrow's order changes can be modified until 10:00 PM today."}</p>
            </div>
          </div>

          {overrideError && <div className="badge badge-danger mb-4 block-alert">{overrideError}</div>}
          {overrideSuccess && <div className="badge badge-success mb-4 block-alert">Tomorrow's order overrides saved!</div>}

          {/* Pause Toggle Bar */}
          <div className="pause-override-bar">
            <div>
              <strong>Pause Tomorrow's Order</strong>
              <p className="text-muted" style={{ fontSize: "12px", marginTop: "2px" }}>
                Skip delivery tomorrow without charge.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePauseToggle}
              disabled={pauseSubmitting || isCutoffPassed()}
              className={`btn ${tomorrowPause ? "btn-secondary" : "btn-outline"}`}
            >
              {pauseSubmitting ? "Updating..." : tomorrowPause ? "⏸️ Paused (Resume)" : "▶️ Active (Pause)"}
            </button>
          </div>

          {!tomorrowPause && (
            <form onSubmit={handleOverrideSubmit}>
              <div className="overrides-products-list">
                {products.map((p) => {
                  const recurring = subscriptionItems.find((item) => item.productId === p.id);
                  const recurringQty = recurring ? recurring.quantity : 0;
                  const currentQty = overrideQuantities[p.id];
                  const isModified = currentQty !== recurringQty;

                  return (
                    <div key={p.id} className="override-product-row">
                      <div className="product-details">
                        <span className="product-emoji">{p.emoji}</span>
                        <div>
                          <strong>{p.name}</strong>
                          <div className="product-price text-muted">
                            {p.size} • ₹{p.price.toFixed(2)}
                            {recurringQty > 0 && (
                              <span className="baseline-indicator">
                                Baseline: {recurringQty}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="override-controls">
                        {isModified && (
                          <button
                            type="button"
                            className="btn-reset-override"
                            onClick={() => handleOverrideQtyChange(p.id, recurringQty)}
                            title="Reset to baseline"
                          >
                            Reset
                          </button>
                        )}
                        <div className="quantity-selector">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => handleOverrideQtyChange(p.id, currentQty - 1)}
                            disabled={overrideSubmitting || isCutoffPassed()}
                          >
                            -
                          </button>
                          <span className="qty-val">{currentQty}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => handleOverrideQtyChange(p.id, currentQty + 1)}
                            disabled={overrideSubmitting || isCutoffPassed()}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full mt-6"
                disabled={overrideSubmitting || isCutoffPassed()}
              >
                {overrideSubmitting ? "Saving Overrides..." : "Save Tomorrow's Delivery Only"}
              </button>
            </form>
          )}

          {tomorrowPause && (
            <div className="tomorrow-paused-screen">
              <span className="paused-icon">⏸️</span>
              <h4>Tomorrow's Delivery is Paused</h4>
              <p className="text-muted">Click "Resume" above to reactivate deliveries and configure overrides.</p>
            </div>
          )}
        </div>

        {/* Right Preview Panel */}
        <div className="tomorrow-preview-panel card">
          <h3>Tomorrow's Delivery Preview</h3>
          <p className="text-muted">Live checkout summary for tomorrow morning's delivery.</p>

          <div className="tomorrow-preview-box">
            {isTomorrowOnVacation() ? (
              <div className="vacation-preview">
                <span className="vacation-icon">✈️</span>
                <h4>Vacation Mode Active</h4>
                <p className="text-muted">All deliveries paused via vacation scheduler.</p>
              </div>
            ) : tomorrowPause ? (
              <div className="paused-preview">
                <span className="pause-icon">⏸️</span>
                <h4>Delivery Paused</h4>
                <p className="text-muted">No items will be delivered tomorrow.</p>
              </div>
            ) : tomorrowActiveItems.length === 0 ? (
              <div className="empty-preview">
                <span className="empty-icon">🛒</span>
                <h4>No Items Scheduled</h4>
                <p className="text-muted">Tomorrow's order is currently empty.</p>
              </div>
            ) : (
              <div className="preview-receipt">
                <div className="receipt-header">Scheduled Items</div>
                <div className="receipt-list">
                  {tomorrowActiveItems.map((item) => (
                    <div key={item.id} className="receipt-row">
                      <div className="receipt-item-details">
                        <span>{item.emoji} {item.name} ({item.size})</span>
                        {item.isModified && <span className="modified-indicator-tag">Override</span>}
                      </div>
                      <strong>{item.qty} x ₹{item.price.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-footer">
                  <div className="footer-row font-large">
                    <span>Tomorrow's Total:</span>
                    <strong>₹{tomorrowTotalCost.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="receipt-alert">
                  ℹ️ <strong>Auto-Deduction:</strong> This total amount will be deducted from your wallet balance after tomorrow morning's silent delivery is marked completed by our delivery partner.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .tomorrow-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .tomorrow-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 32px;
          align-items: flex-start;
        }

        .tomorrow-header {
          margin-bottom: 24px;
        }

        /* Cutoff Warning styling */
        .cutoff-banner {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 13px;
        }

        .cutoff-banner.active {
          background: var(--accent-light);
          color: #B25E00;
          border: 1px solid var(--accent-color);
        }

        .cutoff-banner.passed {
          background: var(--danger-light);
          color: var(--danger-color);
          border: 1px solid var(--danger-color);
        }

        .banner-icon {
          font-size: 24px;
        }

        .cutoff-banner p {
          opacity: 0.9;
          margin-top: 2px;
        }

        /* Pause bar styling */
        .pause-override-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--border-light);
          padding: 16px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          margin-bottom: 24px;
        }

        .pause-override-bar p {
          font-size: 11px;
        }

        /* Product overrides listing */
        .overrides-products-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 480px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .override-product-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-light);
        }

        .override-product-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .product-details {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .product-emoji {
          font-size: 26px;
          background: var(--border-light);
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .product-price {
          font-size: 13px;
          margin-top: 2px;
        }

        .baseline-indicator {
          background: var(--border-light);
          color: var(--text-muted);
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 10px;
          margin-left: 8px;
          display: inline-block;
        }

        .override-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-reset-override {
          background: transparent;
          border: none;
          color: var(--danger-color);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .btn-reset-override:hover {
          background: var(--danger-light);
        }

        .quantity-selector {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 4px;
          background: var(--bg-app);
        }

        .qty-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: var(--bg-card);
          color: var(--text-main);
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qty-btn:hover:not(:disabled) {
          background: var(--primary-light);
          color: var(--primary-color);
        }

        .qty-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .qty-val {
          font-weight: 600;
          width: 24px;
          text-align: center;
        }

        .tomorrow-paused-screen {
          text-align: center;
          padding: 48px 24px;
          background: var(--border-light);
          border-radius: 8px;
          border: 1px dashed var(--border-color);
        }

        .paused-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }

        /* Preview Panel */
        .tomorrow-preview-box {
          margin-top: 20px;
          background: var(--border-light);
          padding: 20px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vacation-preview, .paused-preview, .empty-preview {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .vacation-icon, .pause-icon, .empty-icon {
          font-size: 40px;
        }

        .preview-receipt {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .receipt-header {
          font-size: 11px;
          font-weight: bold;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 6px;
          text-transform: uppercase;
        }

        .receipt-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .receipt-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          align-items: center;
        }

        .receipt-item-details {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modified-indicator-tag {
          font-size: 9px;
          background: var(--accent-light);
          color: #B25E00;
          font-weight: bold;
          padding: 1px 4px;
          border-radius: 4px;
        }

        .receipt-divider {
          border-top: 1px dashed var(--border-color);
          margin: 8px 0;
        }

        .receipt-footer {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .footer-row.font-large {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-main);
          display: flex;
          justify-content: space-between;
        }

        .receipt-alert {
          margin-top: 16px;
          background: var(--bg-card);
          padding: 12px;
          border-radius: 6px;
          font-size: 12px;
          line-height: 1.5;
          color: var(--text-muted);
          border-left: 4px solid var(--accent-color);
        }

        .block-alert {
          display: block;
          text-align: center;
          padding: 10px;
        }

        .w-full {
          width: 100%;
        }

        @media (max-width: 900px) {
          .tomorrow-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
