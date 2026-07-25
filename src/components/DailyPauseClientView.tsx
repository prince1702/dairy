"use client";

import React, { useState } from "react";
import { toggleTomorrowPause } from "@/app/actions";
import { useRouter } from "next/navigation";

interface DailyPauseRecord {
  id: string;
  pauseDate: string;
  createdAt: string;
}

interface DailyPauseClientViewProps {
  customer: {
    id: string;
    name: string;
    email: string;
  };
  dailyPauses: DailyPauseRecord[];
}

export function DailyPauseClientView({
  customer,
  dailyPauses,
}: DailyPauseClientViewProps) {
  const router = useRouter();

  // Find if tomorrow is currently paused in the list
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const isTomorrowPaused = dailyPauses.some((p) => {
    const pDate = new Date(p.pauseDate);
    pDate.setHours(0, 0, 0, 0);
    return pDate.getTime() === tomorrow.getTime();
  });

  const [tomorrowPause, setTomorrowPause] = useState(isTomorrowPaused);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // History filtering & sorting
  const [historySearch, setHistorySearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const isCutoffPassed = () => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setHours(22, 0, 0, 0);
    return now.getTime() > cutoff.getTime();
  };

  const handlePauseToggleChange = async () => {
    if (isCutoffPassed()) {
      setErrorMsg("Cutoff time (10:00 PM) has passed. Tomorrow's pause settings cannot be changed.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const nextState = !tomorrowPause;
    const tomorrowDateStr = tomorrow.toISOString().split("T")[0];

    try {
      const res = await toggleTomorrowPause(customer.id, tomorrowDateStr, nextState);
      setSubmitting(false);

      if (res.success) {
        setTomorrowPause(nextState);
        setSuccessMsg(nextState ? "Tomorrow's delivery successfully paused!" : "Tomorrow's delivery is now active.");
        router.refresh();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(res.error || "Failed to update pause status.");
      }
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err.message || "An unexpected error occurred.");
    }
  };

  // Filter and sort past pauses
  const filteredPauses = dailyPauses
    .filter((p) => {
      const date = new Date(p.pauseDate);
      // exclude tomorrow's pause from past history view for clarity
      if (date.getTime() === tomorrow.getTime()) return false;

      const dateStr = date.toLocaleDateString();
      const createdStr = new Date(p.createdAt).toLocaleDateString();
      return (
        dateStr.includes(historySearch) ||
        createdStr.includes(historySearch)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.pauseDate).getTime();
      const dateB = new Date(b.pauseDate).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="pause-container">
      <div className="pause-grid">
        {/* Left Side: Toggle switch and descriptions */}
        <div className="pause-control-panel card">
          <h3>Quick Daily Pause</h3>
          <p className="text-muted">Pause delivery for tomorrow without scheduling vacation dates. Fits last-minute requirements.</p>

          {/* Cutoff visual alert banner */}
          <div className={`cutoff-visual-alert ${isCutoffPassed() ? "locked" : "active"}`}>
            <span className="banner-icon">{isCutoffPassed() ? "🔒" : "🔓"}</span>
            <div>
              <strong>Daily Cutoff: 10:00 PM</strong>
              <p>{isCutoffPassed() ? "Cutoff time has passed. Deliveries are locked." : "Modify tomorrow's pause state before 10:00 PM today."}</p>
            </div>
          </div>

          {errorMsg && <div className="badge badge-danger mb-4 block-alert animation-shake">{errorMsg}</div>}
          {successMsg && <div className="badge badge-success mb-4 block-alert animation-bounce">{successMsg}</div>}

          <div className="pause-toggle-card">
            <span className="status-label">Tomorrow's Delivery Status</span>
            
            {/* Premium Animated Toggle Switch */}
            <div className="toggle-switch-wrapper mt-4">
              <span className={`status-val-text ${!tomorrowPause ? "active" : ""}`}>Active</span>
              <button
                type="button"
                className={`switch-track ${tomorrowPause ? "paused" : "active"} ${isCutoffPassed() ? "disabled" : ""}`}
                onClick={handlePauseToggleChange}
                disabled={submitting || isCutoffPassed()}
                aria-label="Toggle tomorrow pause state"
              >
                <span className="switch-thumb"></span>
              </button>
              <span className={`status-val-text ${tomorrowPause ? "paused" : ""}`}>Paused</span>
            </div>

            <p className="toggle-hint-text text-muted mt-4">
              {tomorrowPause
                ? "⏸️ Your order will be skipped tomorrow. No charge is applied."
                : "▶️ Your daily schedule items will arrive tomorrow morning."}
            </p>
          </div>

          <div className="pause-info-box-details text-muted">
            💡 <strong>How this works:</strong> Toggle the switch above to pause or resume tomorrow's order. This override will reset automatically the day after tomorrow, returning deliveries to your default daily baseline.
          </div>
        </div>

        {/* Right Side: Logs history */}
        <div className="pause-history-panel card">
          <div className="history-header">
            <h3>Pause History</h3>
            <p className="text-muted">Search and review your past single-day pauses.</p>
          </div>

          {/* Search and Sort controls */}
          <div className="history-controls-row mt-4">
            <input
              type="text"
              placeholder="Search by date..."
              className="form-input search-history-input"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline sort-btn"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              title="Toggle sort order"
            >
              {sortOrder === "desc" ? "📅 Newest First" : "📅 Oldest First"}
            </button>
          </div>

          <div className="pause-history-list mt-4">
            {filteredPauses.length === 0 ? (
              <p className="no-history text-muted text-center py-6">No matching pause logs found.</p>
            ) : (
              filteredPauses.map((p) => {
                const date = new Date(p.pauseDate);
                const created = new Date(p.createdAt);
                return (
                  <div key={p.id} className="history-row">
                    <span className="history-icon">⏸</span>
                    <div className="history-details">
                      <strong>Paused on: {date.toLocaleDateString()}</strong>
                      <p className="text-muted">
                        Requested: {created.toLocaleDateString()} at {created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .pause-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .pause-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 32px;
          align-items: flex-start;
        }

        /* Cutoff Alert styling */
        .cutoff-visual-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          margin-top: 16px;
          font-size: 13px;
        }

        .cutoff-visual-alert.active {
          background: var(--accent-light);
          color: #B25E00;
          border: 1px solid var(--accent-color);
        }

        .cutoff-visual-alert.locked {
          background: var(--danger-light);
          color: var(--danger-color);
          border: 1px solid var(--danger-color);
        }

        .cutoff-visual-alert p {
          opacity: 0.9;
          font-size: 11px;
          margin-top: 1px;
        }

        /* Toggle Card styling */
        .pause-toggle-card {
          margin-top: 24px;
          background: var(--border-light);
          padding: 24px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          text-align: center;
        }

        .status-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          display: block;
        }

        /* Premium animated toggle switch */
        .toggle-switch-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .status-val-text {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-muted);
          transition: color 0.2s;
        }

        .status-val-text.active {
          color: var(--primary-color);
          font-weight: 700;
        }

        .status-val-text.paused {
          color: var(--danger-color);
          font-weight: 700;
        }

        .switch-track {
          width: 60px;
          height: 32px;
          border-radius: 20px;
          border: none;
          background: #E5E7EB;
          position: relative;
          cursor: pointer;
          transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }

        .switch-track.active {
          background-color: var(--primary-color);
        }

        .switch-track.paused {
          background-color: var(--danger-color);
        }

        .switch-track.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .switch-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .switch-track.paused .switch-thumb {
          transform: translateX(28px);
        }

        .toggle-hint-text {
          font-size: 13px;
          font-weight: 500;
        }

        .pause-info-box-details {
          margin-top: 20px;
          font-size: 12px;
          line-height: 1.5;
        }

        /* History search controls */
        .history-controls-row {
          display: flex;
          gap: 10px;
        }

        .search-history-input {
          flex: 1;
        }

        .sort-btn {
          font-size: 12px;
          padding: 8px 12px;
          border-radius: 8px;
          white-space: nowrap;
        }

        .pause-history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
        }

        .history-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px dashed var(--border-light);
        }

        .history-row:last-child {
          border-bottom: none;
        }

        .history-icon {
          color: var(--danger-color);
          background: var(--danger-light);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }

        .history-details strong {
          font-size: 14px;
        }

        .history-details p {
          font-size: 11px;
          margin-top: 2px;
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

        @media (max-width: 900px) {
          .pause-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
