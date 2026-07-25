"use client";

import React, { useState } from "react";
import { updateSubscription } from "@/app/actions";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  emoji: string;
  category: string;
  price: number;
  size: string;
}

interface SubscriptionClientViewProps {
  customer: {
    id: string;
    name: string;
    email: string;
  };
  subscriptionItems: {
    productId: string;
    quantity: number;
  }[];
  products: Product[];
}

export function SubscriptionClientView({
  customer,
  subscriptionItems,
  products,
}: SubscriptionClientViewProps) {
  const router = useRouter();

  // Quantities state
  const [subQuantities, setSubQuantities] = useState<Record<string, number>>(() => {
    const quantities: Record<string, number> = {};
    products.forEach((p) => {
      const existing = subscriptionItems.find((item) => item.productId === p.id);
      quantities[p.id] = existing ? existing.quantity : 0;
    });
    return quantities;
  });

  const [subSubmitting, setSubSubmitting] = useState(false);
  const [subSuccess, setSubSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState<"ALL" | "MORNING" | "EVENING">("ALL");

  const handleQtyChange = (productId: string, val: number) => {
    setSubQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubSubmitting(true);
    setSubSuccess(false);
    setErrorMsg("");

    const items = Object.entries(subQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, qty]) => ({ productId, quantity: qty }));

    try {
      const res = await updateSubscription(customer.id, items);
      setSubSubmitting(false);

      if (res.success) {
        setSubSuccess(true);
        router.refresh();
        setTimeout(() => setSubSuccess(false), 3000);
      } else {
        setErrorMsg(res.error || "Failed to update subscription schedule.");
      }
    } catch (err: any) {
      setSubSubmitting(false);
      setErrorMsg(err.message || "An unexpected error occurred.");
    }
  };

  // Classify products into schedules based on category
  const getProductSchedule = (product: Product) => {
    const cat = product.category.toLowerCase();
    if (cat.includes("milk") || cat.includes("dairy") || cat.includes("bread") || cat.includes("egg")) {
      return "MORNING";
    }
    return "EVENING";
  };

  // Filter products based on selected schedule tabs
  const filteredProducts = products.filter((p) => {
    if (scheduleFilter === "ALL") return true;
    return getProductSchedule(p) === scheduleFilter;
  });

  // Calculate live daily preview cost
  const previewItems = products
    .map((p) => ({
      ...p,
      qty: subQuantities[p.id] || 0,
    }))
    .filter((p) => p.qty > 0);

  const totalDailyCost = previewItems.reduce((sum, p) => sum + p.price * p.qty, 0);

  return (
    <div className="subscription-container">
      <div className="subscription-grid">
        {/* Main Product Selector Form */}
        <div className="products-selection-panel card">
          <div className="panel-header">
            <h3>Modify Recurring Delivery Schedule</h3>
            <p className="text-muted">Select your baseline daily products and modify their quantities.</p>
          </div>

          {/* Schedule Filtering Tabs */}
          <div className="schedule-tabs">
            <button
              className={`tab-btn ${scheduleFilter === "ALL" ? "active" : ""}`}
              onClick={() => setScheduleFilter("ALL")}
            >
              📅 All Schedule
            </button>
            <button
              className={`tab-btn ${scheduleFilter === "MORNING" ? "active" : ""}`}
              onClick={() => setScheduleFilter("MORNING")}
            >
              🥛 Morning (5 AM - 7 AM)
            </button>
            <button
              className={`tab-btn ${scheduleFilter === "EVENING" ? "active" : ""}`}
              onClick={() => setScheduleFilter("EVENING")}
            >
              🧀 Evening (5 PM - 7 PM)
            </button>
          </div>

          {errorMsg && <div className="badge badge-danger mb-4 block-alert">{errorMsg}</div>}
          {subSuccess && <div className="badge badge-success mb-4 block-alert">Baseline subscription updated successfully!</div>}

          <form onSubmit={handleSubSubmit}>
            <div className="products-list-wrapper">
              {filteredProducts.length === 0 ? (
                <div className="no-products text-muted text-center py-6">
                  No products available in this category.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const schedule = getProductSchedule(p);
                  return (
                    <div key={p.id} className="sub-product-row">
                      <div className="product-info-col">
                        <span className="emoji-avatar">{p.emoji}</span>
                        <div>
                          <strong className="product-name">{p.name}</strong>
                          <div className="product-meta text-muted">
                            {p.size} • ₹{p.price.toFixed(2)}
                            <span className={`schedule-badge ${schedule.toLowerCase()}`}>
                              {schedule === "MORNING" ? "Morning 🥛" : "Evening 🧀"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="quantity-controller">
                        <button
                          type="button"
                          className="qty-adjust-btn"
                          onClick={() => handleQtyChange(p.id, subQuantities[p.id] - 1)}
                          disabled={subSubmitting}
                        >
                          -
                        </button>
                        <span className="qty-value-display">{subQuantities[p.id]}</span>
                        <button
                          type="button"
                          className="qty-adjust-btn"
                          onClick={() => handleQtyChange(p.id, subQuantities[p.id] + 1)}
                          disabled={subSubmitting}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button type="submit" className="btn btn-primary w-full mt-6" disabled={subSubmitting}>
              {subSubmitting ? "Saving Baseline..." : "Save Baseline Schedule"}
            </button>
          </form>
        </div>

        {/* Subscription Preview Panel */}
        <div className="subscription-preview-panel card">
          <h3>Subscription Preview</h3>
          <p className="text-muted">What your recurring daily delivery and wallet deduction will look like.</p>

          <div className="preview-receipt-box">
            {previewItems.length === 0 ? (
              <div className="empty-preview text-center py-6 text-muted">
                🛒 Select quantities on the left to preview your subscription.
              </div>
            ) : (
              <div className="preview-active-list">
                <div className="preview-section-title">DAILY ITEMS</div>
                <div className="preview-items-list">
                  {previewItems.map((item) => (
                    <div key={item.id} className="preview-item-row">
                      <span>
                        {item.emoji} {item.name} ({item.size})
                      </span>
                      <strong>
                        {item.qty} x ₹{item.price.toFixed(2)}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="preview-divider"></div>

                <div className="preview-summary-footer">
                  <div className="summary-row font-large">
                    <span>Est. Daily Total Cost:</span>
                    <strong>₹{totalDailyCost.toFixed(2)}</strong>
                  </div>
                  <div className="summary-row font-large">
                    <span>Est. Monthly Budget:</span>
                    <strong>₹{(totalDailyCost * 30).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="info-box-alert">
                  💡 <strong>How it works:</strong> This is your default daily delivery list. These products will arrive silently at your address every morning. You can toggle pauses or overrides under "Tomorrow Changes" whenever you want.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Local styles */}
      <style jsx>{`
        .subscription-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .subscription-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 32px;
          align-items: flex-start;
        }

        .panel-header {
          margin-bottom: 24px;
        }

        .schedule-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }

        .tab-btn {
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

        .tab-btn:hover {
          background: var(--border-light);
          color: var(--text-main);
        }

        .tab-btn.active {
          background: var(--primary-light);
          color: var(--primary-color);
          border-color: var(--primary-color);
          font-weight: 600;
        }

        .products-list-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 550px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .sub-product-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-light);
        }

        .sub-product-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .product-info-col {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .emoji-avatar {
          font-size: 26px;
          background: var(--border-light);
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .product-name {
          font-size: 15px;
          color: var(--text-main);
        }

        .product-meta {
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 2px;
        }

        .schedule-badge {
          font-size: 10px;
          font-weight: bold;
          padding: 1px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .schedule-badge.morning {
          background: var(--primary-light);
          color: var(--primary-color);
        }

        .schedule-badge.evening {
          background: var(--accent-light);
          color: var(--accent-color);
        }

        .quantity-controller {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 4px;
          background: var(--bg-app);
        }

        .qty-adjust-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: var(--bg-card);
          color: var(--text-main);
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: background 0.2s;
        }

        .qty-adjust-btn:hover:not(:disabled) {
          background: var(--primary-light);
          color: var(--primary-color);
        }

        .qty-adjust-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .qty-value-display {
          font-weight: 600;
          width: 24px;
          text-align: center;
        }

        /* Preview Panel */
        .preview-receipt-box {
          margin-top: 20px;
          background: var(--border-light);
          padding: 20px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .preview-active-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .preview-section-title {
          font-size: 11px;
          font-weight: bold;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 6px;
        }

        .preview-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .preview-item-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }

        .preview-divider {
          border-top: 1px dashed var(--border-color);
          margin: 8px 0;
        }

        .preview-summary-footer {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }

        .summary-row.font-large {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-main);
        }

        .info-box-alert {
          margin-top: 16px;
          background: var(--bg-card);
          border-left: 4px solid var(--primary-color);
          padding: 12px;
          border-radius: 6px;
          font-size: 12px;
          line-height: 1.5;
          color: var(--text-muted);
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
          .subscription-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
