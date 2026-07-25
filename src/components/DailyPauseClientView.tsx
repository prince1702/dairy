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
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const isTomorrowPaused = dailyPauses.some((p) => {
    const pDate = new Date(p.pauseDate);
    pDate.setHours(0, 0, 0, 0);
    return pDate.getTime() === tomorrow.getTime();
  });

  const [tomorrowPause, setTomorrowPause] = useState(isTomorrowPaused);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const isCutoffPassed = () => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setHours(22, 0, 0, 0);
    return now.getTime() > cutoff.getTime();
  };

  const handlePauseToggle = async () => {
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

  // Group past pauses
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const pastPauses = dailyPauses.filter((p) => {
    const pDate = new Date(p.pauseDate);
    pDate.setHours(0,0,0,0);
    return pDate.getTime() < tomorrow.getTime();
  });

  return (
    <div className="pause-container">
      <div className="pause-grid">
        {/* Left Side: Toggle controls */}
        <div className="pause-control-panel card">
          <h3>Quick Daily Pause</h3>
          <p className="text-muted">Pause delivery for tomorrow without setting up a full vacation range. Ideal for last-minute schedule changes.</p>

          {/* Cutoff warning */}
          <div className={`cutoff-banner-mini ${isCutoffPassed() ? "passed" : "active"}`}>
            <span>{isCutoffPassed() ? "🔒" : "🔓"}</span>
            <div>
              <strong>Daily Cutoff: 10:00 PM</strong>
              <p>{isCutoffPassed() ? "Cutoff passed. Delivery settings locked." : "Modify tomorrow's pause state before 10:00 PM."}</p>
            </div>
          </div>

          {errorMsg && <div className="badge badge-danger mb-4 block-alert">{errorMsg}</div>}
          {successMsg && <div className="badge badge-success mb-4 block-alert">{successMsg}</div>}

          <div className="pause-toggle-card">
            <div className="status-indicator">
              <span className="status-label">Tomorrow's Delivery Status</span>
              <span className={`status-val ${tomorrowPause ? "paused" : "active"}`}>
                {tomorrowPause ? "⏸️ PAUSED" : "▶️ ACTIVE"}
              </span>
            </div>

            <button
              type="button"
              onClick={handlePauseToggle}
              disabled={submitting || isCutoffPassed()}
              className={`btn w-full mt-4 ${tomorrowPause ? "btn-primary" : "btn-outline"}`}
            >
              {submitting ? "Updating..." : tomorrowPause ? "Resume Tomorrow's Delivery" : "Pause Tomorrow's Delivery"}
            </button>
          </div>

          <div className="pause-info-box text-muted">
            ℹ️ <strong>How this works:</strong> Pausing tomorrow skips tomorrow morning's delivery. Your wallet balance will not be charged. This affects tomorrow's date only, and regular deliveries will resume automatically the day after.
          </div>
        </div>

        {/* Right Side: History list */}
        <div className="pause-history-panel card">
          <h3>Pause History</h3>
          <p className="text-muted">A record of your past single-day pauses.</p>

          <div className="pause-history-list">
            {pastPauses.length === 0 ? (
              <p className="no-history text-muted">No past pause records found.</p>
            ) : (
              pastPauses.map((p) => {
                const date = new Date(p.pauseDate);
                const created = new Date(p.createdAt);
                return (
                  <div key={p.id} className="history-row">
                    <span className="history-icon">⏸</span>
                    <div className="history-details">
                      <strong>Paused on: {date.toLocaleDateString()}</strong>
                      <p className="text-muted">Requested on: {created.toLocaleDateString()} at {created.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
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

        /* Cutoff warning banner */
        .cutoff-banner-mini {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          margin-top: 16px;
          font-size: 13px;
        }

        .cutoff-banner-mini.active {
          background: var(--accent-light);
          color: #B25E00;
          border: 1px solid var(--accent-color);
        }

        .cutoff-banner-mini.passed {
          background: var(--danger-light);
          color: var(--danger-color);
          border: 1px solid var(--danger-color);
        }

        .cutoff-banner-mini p {
          opacity: 0.95;
          font-size: 11px;
          margin-top: 1px;
        }

        /* Toggle status box styling */
        .pause-toggle-card {
          margin-top: 24px;
          background: var(--border-light);
          padding: 24px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          text-align: center;
        }

        .status-indicator {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .status-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .status-val {
          font-size: 24px;
          font-weight: 800;
        }

        .status-val.active {
          color: var(--primary-color);
        }

        .status-val.paused {
          color: var(--danger-color);
        }

        .pause-info-box {
          margin-top: 20px;
          font-size: 12px;
          line-height: 1.5;
        }

        /* History styling */
        .pause-history-list {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
        }

        .no-history {
          font-size: 13px;
          font-style: italic;
          padding: 12px 0;
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
          font-weight: bold;
          font-size: 12px;
        }

        .history-details strong {
          font-size: 14px;
        }

        .history-details p {
          font-size: 11px;
          margin-top: 2px;
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
          .pause-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
