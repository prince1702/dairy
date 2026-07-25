"use client";

import React, { useState, useEffect } from "react";
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

  // Tomorrow's state
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

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Cutoff time progress states (10:00 PM today)
  const [timeUntilCutoff, setTimeUntilCutoff] = useState("");
  const [cutoffProgress, setCutoffProgress] = useState(100);

  useEffect(() => {
    const calculateCutoff = () => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(22, 0, 0, 0); // 10 PM
      
      const diff = cutoff.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilCutoff("Passed (Locked)");
        setCutoffProgress(0);
      } else {
        // Calculate progress percentage from 8 AM to 10 PM (14 hours total)
        const startDay = new Date();
        startDay.setHours(8, 0, 0, 0);
        const totalDuration = cutoff.getTime() - startDay.getTime();
        const currentElapsed = now.getTime() - startDay.getTime();
        const progress = Math.max(0, Math.min(100, 100 - (currentElapsed / totalDuration) * 100));

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntilCutoff(`${hours}h ${minutes}m remaining`);
        setCutoffProgress(progress);
      }
    };

    calculateCutoff();
    const interval = setInterval(calculateCutoff, 60000);
    return () => clearInterval(interval);
  }, []);

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

  const triggerSaveConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCutoffPassed()) {
      setOverrideError("Cutoff time (10:00 PM) has passed. Changes cannot be saved.");
      return;
    }
    setShowConfirmModal(true);
  };

  const executeSaveOverrides = async () => {
    setShowConfirmModal(false);
    setOverrideSubmitting(true);
    setOverrideSuccess(false);
    setOverrideError("");

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
      setOverrideError("Cutoff time (10:00 PM) has passed. Tomorrow's pause settings cannot be changed.");
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

  // Compile comparison data
  const comparisonItems = products
    .map((p) => {
      const baselineQty = subscriptionItems.find((s) => s.productId === p.id)?.quantity || 0;
      const overrideQty = overrideQuantities[p.id] || 0;
      const difference = overrideQty - baselineQty;
      const priceDiff = difference * p.price;

      return {
        ...p,
        baselineQty,
        overrideQty,
        difference,
        priceDiff,
      };
    })
    .filter((p) => p.baselineQty > 0 || p.overrideQty > 0);

  const tomorrowActiveItems = comparisonItems.filter((p) => p.overrideQty > 0);
  const tomorrowTotalCost = tomorrowActiveItems.reduce((sum, p) => sum + p.price * p.overrideQty, 0);

  return (
    <div className="tomorrow-wrapper">
      <div className="tomorrow-grid">
        {/* Left Side: Overrides Selector */}
        <div className="tomorrow-control-panel card">
          <div className="tomorrow-header">
            <h3>One-Day Quantities Override</h3>
            <p className="text-muted">Modify quantities for tomorrow's order. Does not overwrite your daily baseline schedule.</p>
          </div>

          {/* Cutoff progress visualizer bar */}
          <div className={`cutoff-progress-banner ${isCutoffPassed() ? "locked" : ""}`}>
            <div className="cutoff-banner-text">
              <span>{isCutoffPassed() ? "🔒 Locked (After 10:00 PM)" : "🔓 Changes open"}</span>
              <strong>{timeUntilCutoff}</strong>
            </div>
            {!isCutoffPassed() && (
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${cutoffProgress}%` }}></div>
              </div>
            )}
            <span className="cutoff-sub-desc">Cutoff time: 10:00 PM daily. Next delivery starts around 5:00 AM.</span>
          </div>

          {overrideError && <div className="badge badge-danger mb-4 block-alert">{overrideError}</div>}
          {overrideSuccess && <div className="badge badge-success mb-4 block-alert">Tomorrow's order settings saved!</div>}

          {/* Daily Pause Bar */}
          <div className="pause-override-bar">
            <div>
              <strong>Pause Tomorrow's Order</strong>
              <p className="text-muted" style={{ fontSize: "12px", marginTop: "2px" }}>
                Skip delivery tomorrow without wallet charge.
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
            <form onSubmit={triggerSaveConfirm}>
              <div className="products-override-list">
                {products.map((p) => {
                  const baselineQty = subscriptionItems.find((item) => item.productId === p.id)?.quantity || 0;
                  const currentQty = overrideQuantities[p.id] || 0;
                  const isModified = currentQty !== baselineQty;

                  return (
                    <div key={p.id} className="override-row">
                      <div className="override-p-info">
                        <span className="override-p-emoji">{p.emoji}</span>
                        <div>
                          <strong>{p.name}</strong>
                          <div className="override-p-meta text-muted">
                            {p.size} • ₹{p.price.toFixed(2)}
                            {baselineQty > 0 && (
                              <span className="badge-baseline">
                                Baseline: {baselineQty}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="override-actions">
                        {isModified && (
                          <button
                            type="button"
                            className="btn-reset"
                            onClick={() => handleOverrideQtyChange(p.id, baselineQty)}
                          >
                            Reset
                          </button>
                        )}
                        <div className="qty-selector">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => handleOverrideQtyChange(p.id, currentQty - 1)}
                            disabled={isCutoffPassed()}
                          >
                            -
                          </button>
                          <span className="qty-val">{currentQty}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => handleOverrideQtyChange(p.id, currentQty + 1)}
                            disabled={isCutoffPassed()}
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
                Save Tomorrow's Delivery Only
              </button>
            </form>
          )}

          {tomorrowPause && (
            <div className="paused-container">
              <span className="paused-icon">⏸️</span>
              <h4>Tomorrow's delivery is paused</h4>
              <p className="text-muted">You will not receive any items tomorrow. Reactivate by clicking "Resume" above.</p>
            </div>
          )}
        </div>

        {/* Right Side: Order Preview & Comparison Table */}
        <div className="tomorrow-preview-panel card">
          <h3>Tomorrow's Delivery Preview</h3>
          <p className="text-muted">Review baseline vs tomorrow's override quantities and total checkout differences.</p>

          <div className="preview-receipt-wrapper mt-4">
            {isTomorrowOnVacation() ? (
              <div className="status-screen vacation">
                <span className="screen-icon">✈️</span>
                <h4>Vacation Mode Active</h4>
                <p className="text-muted">All deliveries paused via vacation planner.</p>
              </div>
            ) : tomorrowPause ? (
              <div className="status-screen paused">
                <span className="screen-icon">⏸️</span>
                <h4>Delivery Paused</h4>
                <p className="text-muted">Tomorrow's order is paused. No deductions will occur.</p>
              </div>
            ) : comparisonItems.length === 0 ? (
              <div className="status-screen empty">
                <span className="screen-icon">🛒</span>
                <h4>No Items Scheduled</h4>
                <p className="text-muted">You have no baseline subscription items or overrides.</p>
              </div>
            ) : (
              <div className="receipt-checkout">
                <div className="comparison-table-header">ORDER COMPARISON</div>
                
                {/* Comparison Table */}
                <div className="comparison-table mt-2">
                  <div className="comparison-row table-head">
                    <span>Product</span>
                    <span className="text-center">Baseline</span>
                    <span className="text-center">Tomorrow</span>
                    <span className="text-right">Difference</span>
                  </div>

                  {comparisonItems.map((item) => {
                    const diffSign = item.difference > 0 ? `+${item.difference}` : item.difference;
                    return (
                      <div key={item.id} className={`comparison-row table-body-row ${item.difference !== 0 ? "modified" : ""}`}>
                        <span className="p-title-row">{item.emoji} {item.name}</span>
                        <span className="text-center">{item.baselineQty}</span>
                        <span className="text-center font-bold">{item.overrideQty}</span>
                        <span className={`text-right diff-val ${item.difference > 0 ? "positive" : item.difference < 0 ? "negative" : "neutral"}`}>
                          {item.difference === 0 ? "No change" : `${diffSign} (₹${item.priceDiff.toFixed(2)})`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-summary">
                  <div className="summary-row font-large">
                    <span>Tomorrow's Total cost:</span>
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

      {/* 5. Confirmation Dialog Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Confirm Overrides</h3>
            <p>You are about to save changes for tomorrow morning's order. This override will apply only to tomorrow's delivery.</p>
            
            <div className="comparison-preview-modal-list">
              {comparisonItems.filter(i => i.difference !== 0).map((item) => {
                const diffText = item.difference > 0 ? `increased by +${item.difference}` : `decreased by ${item.difference}`;
                return (
                  <div key={item.id} className="modal-list-item">
                    <span>{item.emoji} {item.name}:</span>
                    <strong>{diffText} ({item.baselineQty} → {item.overrideQty})</strong>
                  </div>
                );
              })}
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={executeSaveOverrides}>
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .tomorrow-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .tomorrow-grid {
          display: grid;
          grid-template-columns: 1.5fr 1.1fr;
          gap: 32px;
          align-items: flex-start;
        }

        .tomorrow-header {
          margin-bottom: 20px;
        }

        /* Cutoff progress Visualizer */
        .cutoff-progress-banner {
          background: var(--accent-light);
          color: #B25E00;
          border: 1px solid var(--accent-color);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 24px;
        }

        .cutoff-progress-banner.locked {
          background: var(--danger-light);
          color: var(--danger-color);
          border-color: var(--danger-color);
        }

        .cutoff-banner-text {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .progress-bar-bg {
          background: rgba(0,0,0,0.1);
          height: 6px;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-bar-fill {
          background: var(--accent-color);
          height: 100%;
          border-radius: 3px;
          transition: width 0.4s ease;
        }

        .locked .progress-bar-fill {
          background: var(--danger-color);
        }

        .cutoff-sub-desc {
          font-size: 10px;
          opacity: 0.9;
        }

        /* Daily Pause Bar */
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

        /* Overrides list */
        .products-override-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 480px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .override-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-light);
        }

        .override-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .override-p-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .override-p-emoji {
          font-size: 24px;
          width: 44px;
          height: 44px;
          background: var(--border-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .override-p-meta {
          font-size: 12px;
          margin-top: 2px;
        }

        .badge-baseline {
          background: var(--border-color);
          color: var(--text-muted);
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 10px;
          margin-left: 8px;
          display: inline-block;
        }

        .override-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-reset {
          background: transparent;
          border: none;
          color: var(--danger-color);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px;
        }

        .qty-selector {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 4px;
          background: var(--bg-app);
        }

        .qty-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: none;
          background: var(--bg-card);
          color: var(--text-main);
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .qty-btn:hover {
          background: var(--primary-light);
          color: var(--primary-color);
        }

        .qty-val {
          font-weight: 600;
          width: 20px;
          text-align: center;
          font-size: 13px;
        }

        .paused-container {
          text-align: center;
          padding: 48px 24px;
          background: var(--border-light);
          border-radius: 12px;
          border: 1px dashed var(--border-color);
        }

        .paused-icon {
          font-size: 40px;
          display: block;
          margin-bottom: 8px;
        }

        /* Preview Panel receipt */
        .preview-receipt-wrapper {
          background: var(--border-light);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          min-height: 250px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-screen {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .screen-icon {
          font-size: 40px;
        }

        .receipt-checkout {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .comparison-table-header {
          font-size: 11px;
          font-weight: bold;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 8px;
          text-transform: uppercase;
        }

        .comparison-table {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .comparison-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          font-size: 13px;
          align-items: center;
        }

        .comparison-row.table-head {
          font-weight: 600;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 6px;
        }

        .comparison-row.table-body-row {
          border-bottom: 1px solid rgba(0,0,0,0.03);
          padding: 6px 0;
        }

        .comparison-row.table-body-row.modified {
          background: var(--accent-light);
          border-radius: 4px;
          padding: 6px 4px;
        }

        .p-title-row {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .diff-val.positive { color: var(--primary-color); font-weight: 600; }
        .diff-val.negative { color: var(--danger-color); font-weight: 600; }
        .diff-val.neutral { color: var(--text-muted); }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }

        .receipt-divider {
          border-top: 1px dashed var(--border-color);
          margin: 8px 0;
        }

        .receipt-summary {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .summary-row.font-large {
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

        /* Modal list preview */
        .comparison-preview-modal-list {
          margin: 16px 0;
          background: var(--border-light);
          padding: 12px;
          border-radius: 8px;
          max-height: 180px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .modal-list-item {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .block-alert {
          display: block;
          text-align: center;
          padding: 10px;
        }

        .w-full {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
