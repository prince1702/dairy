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

  // Search & Category Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

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

  // Floating label active states
  const [isNoteActive, setIsNoteActive] = useState(false);
  const [specialNote, setSpecialNote] = useState("");

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

  // Get unique categories list
  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category)))];

  // Filter products by category & search query
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const previewItems = products
    .map((p) => ({
      ...p,
      qty: subQuantities[p.id] || 0,
    }))
    .filter((p) => p.qty > 0);

  const totalDailyCost = previewItems.reduce((sum, p) => sum + p.price * p.qty, 0);

  return (
    <div className="subscription-wrapper">
      <div className="subscription-grid-layout">
        {/* Left Side: Product catalog selector */}
        <div className="catalog-panel card">
          <div className="panel-header">
            <h3>Modify Recurring Delivery Schedule</h3>
            <p className="text-muted">Search products and choose the baseline quantity to be delivered to your door daily.</p>
          </div>

          {/* Search bar & Categories Row */}
          <div className="catalog-filters-row">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search catalog..."
                className="form-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="category-scroll-container">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-tag-btn ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && <div className="badge badge-danger mb-4 block-alert animation-shake">{errorMsg}</div>}
          {subSuccess && <div className="badge badge-success mb-4 block-alert animation-bounce">✓ Baseline subscription updated successfully!</div>}

          <form onSubmit={handleSubSubmit}>
            {/* Products grid cards */}
            <div className="products-grid-catalog mt-4">
              {filteredProducts.length === 0 ? (
                <div className="empty-catalog text-muted py-8 text-center w-full">
                  🔍 No products match your search.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const qty = subQuantities[p.id] || 0;
                  return (
                    <div key={p.id} className={`product-catalog-card ${qty > 0 ? "selected" : ""}`}>
                      <span className="p-emoji-badge">{p.emoji}</span>
                      <div className="p-card-details">
                        <strong>{p.name}</strong>
                        <span className="p-card-meta text-muted">
                          {p.size} • ₹{p.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="catalog-qty-selector">
                        <button
                          type="button"
                          className="qty-adjust-icon-btn"
                          onClick={() => handleQtyChange(p.id, qty - 1)}
                          disabled={subSubmitting}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="qty-value-text">{qty}</span>
                        <button
                          type="button"
                          className="qty-adjust-icon-btn"
                          onClick={() => handleQtyChange(p.id, qty + 1)}
                          disabled={subSubmitting}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Simulated Floating Label Field for Delivery Notes */}
            <div className={`floating-form-group mt-6 ${isNoteActive || specialNote ? "focused" : ""}`}>
              <label className="floating-label" htmlFor="delivery-notes">
                Special Delivery Instructions (Optional)
              </label>
              <input
                id="delivery-notes"
                type="text"
                className="form-input floating-input"
                value={specialNote}
                onChange={(e) => {
                  if (e.target.value.length <= 100) setSpecialNote(e.target.value);
                }}
                onFocus={() => setIsNoteActive(true)}
                onBlur={() => setIsNoteActive(false)}
                disabled={subSubmitting}
              />
              <span className="char-counter text-muted">{specialNote.length}/100</span>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-6 loading-btn-parent" disabled={subSubmitting}>
              {subSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Saving Schedule Changes...
                </>
              ) : (
                "Save Baseline Schedule"
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Subscription Preview Panel */}
        <div className="preview-panel card">
          <h3>Subscription Preview</h3>
          <p className="text-muted">A clear receipt showing your daily and monthly wallet deductions.</p>

          <div className="receipt-container mt-6">
            {previewItems.length === 0 ? (
              <div className="empty-receipt text-center py-8 text-muted">
                🛒 Add products to your daily schedule on the left to see the receipt breakdown.
              </div>
            ) : (
              <div className="active-receipt">
                <div className="receipt-title">Daily Order Shell</div>
                <div className="receipt-list">
                  {previewItems.map((item) => (
                    <div key={item.id} className="receipt-item">
                      <span>{item.emoji} {item.name} ({item.size})</span>
                      <strong>
                        {item.qty} x ₹{item.price.toFixed(2)}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-summary">
                  <div className="summary-row font-large">
                    <span>Daily Total Cost:</span>
                    <strong>₹{totalDailyCost.toFixed(2)}</strong>
                  </div>
                  <div className="summary-row font-large">
                    <span>Est. Monthly Budget:</span>
                    <strong>₹{(totalDailyCost * 30).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="receipt-info-alert">
                  💡 <strong>Auto-Billing:</strong> These baseline products will arrive automatically at your address. Adjust overrides under "Tomorrow Changes" whenever you want to pause/change for tomorrow without touching this baseline.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .subscription-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .subscription-grid-layout {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 32px;
          align-items: flex-start;
        }

        .panel-header {
          margin-bottom: 20px;
        }

        /* Filter header styling */
        .catalog-filters-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
          margin-bottom: 16px;
        }

        .category-scroll-container {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          -scrollbar-width: none;
        }

        .category-scroll-container::-webkit-scrollbar {
          display: none;
        }

        .category-tag-btn {
          padding: 6px 12px;
          background: var(--border-light);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .category-tag-btn:hover {
          background: var(--border-color);
          color: var(--text-main);
        }

        .category-tag-btn.active {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        /* Catalog grid cards */
        .products-grid-catalog {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          max-height: 500px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .product-catalog-card {
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--bg-card);
          transition: all 0.2s;
        }

        .product-catalog-card.selected {
          border-color: var(--primary-color);
          background: var(--primary-light);
          box-shadow: 0 4px 8px var(--shadow-color);
        }

        .p-emoji-badge {
          font-size: 24px;
          width: 42px;
          height: 42px;
          background: var(--border-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .p-card-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex: 1;
        }

        .p-card-details strong {
          font-size: 14px;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .p-card-meta {
          font-size: 12px;
        }

        .catalog-qty-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--border-light);
          padding: 2px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .qty-adjust-icon-btn {
          width: 26px;
          height: 26px;
          background: var(--bg-card);
          border: none;
          color: var(--text-main);
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qty-adjust-icon-btn:hover {
          background: var(--primary-light);
          color: var(--primary-color);
        }

        .qty-adjust-icon-btn:disabled {
          opacity: 0.5;
        }

        .qty-value-text {
          font-size: 13px;
          font-weight: 600;
          width: 16px;
          text-align: center;
        }

        /* Floating label styles */
        .floating-form-group {
          position: relative;
          margin-top: 24px;
        }

        .floating-label {
          position: absolute;
          left: 16px;
          top: 12px;
          font-size: 14px;
          color: var(--text-muted);
          pointer-events: none;
          transition: transform 0.2s, font-size 0.2s, color 0.2s;
        }

        .floating-input {
          padding-top: 18px;
          padding-bottom: 6px;
        }

        .floating-form-group.focused .floating-label,
        .floating-form-group.focused .floating-input:not([value=""]) + .floating-label {
          transform: translateY(-8px) scale(0.85);
          transform-origin: top left;
          color: var(--primary-color);
        }

        .char-counter {
          position: absolute;
          right: 12px;
          bottom: 10px;
          font-size: 11px;
        }

        /* Loader Button styling */
        .loading-btn-parent {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Animation validation */
        .animation-shake {
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .animation-bounce {
          animation: bounce 0.4s ease;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        /* Receipt styling */
        .receipt-container {
          background: var(--border-light);
          border: 1px solid var(--border-color);
          padding: 24px;
          border-radius: 12px;
        }

        .receipt-title {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 8px;
          margin-bottom: 16px;
        }

        .receipt-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .receipt-item {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }

        .receipt-divider {
          border-top: 1px dashed var(--border-color);
          margin: 16px 0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
        }

        .summary-row.font-large {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-main);
        }

        .receipt-info-alert {
          margin-top: 20px;
          background: var(--bg-card);
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid var(--primary-color);
          font-size: 12px;
          line-height: 1.5;
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
          .subscription-grid-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .products-grid-catalog {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
