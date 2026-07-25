"use client";

import React, { useState } from "react";
import { setVacationMode, cancelVacation } from "@/app/actions";
import { useRouter } from "next/navigation";

interface VacationRecord {
  id: string;
  startDate: string;
  endDate: string;
}

interface VacationModeClientViewProps {
  customer: {
    id: string;
    name: string;
    email: string;
  };
  vacations: VacationRecord[];
}

export function VacationModeClientView({
  customer,
  vacations,
}: VacationModeClientViewProps) {
  const router = useRouter();

  // Vacation Form State
  const [vacationStart, setVacationStart] = useState("");
  const [vacationEnd, setVacationEnd] = useState("");
  const [reason, setReason] = useState("");
  const [vacationSubmitting, setVacationSubmitting] = useState(false);
  const [vacationSuccess, setVacationSuccess] = useState("");
  const [vacationError, setVacationError] = useState("");

  // Confirmation modal state
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Focus states for floating labels
  const [focusStart, setFocusStart] = useState(false);
  const [focusEnd, setFocusEnd] = useState(false);
  const [focusReason, setFocusReason] = useState(false);

  const handleVacationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacationStart || !vacationEnd) {
      setVacationError("Please select both start and end dates.");
      return;
    }

    const start = new Date(vacationStart);
    const end = new Date(vacationEnd);

    if (end < start) {
      setVacationError("End date cannot be before start date.");
      return;
    }

    setVacationSubmitting(true);
    setVacationError("");
    setVacationSuccess("");

    try {
      const res = await setVacationMode(customer.id, vacationStart, vacationEnd);
      setVacationSubmitting(false);

      if (res.success) {
        setVacationSuccess("Vacation period scheduled successfully!");
        setVacationStart("");
        setVacationEnd("");
        setReason("");
        router.refresh();
      } else {
        setVacationError(res.error || "Failed to schedule vacation.");
      }
    } catch (err: any) {
      setVacationSubmitting(false);
      setVacationError(err.message || "An error occurred.");
    }
  };

  const triggerCancelConfirm = (id: string) => {
    setConfirmCancelId(id);
    setShowCancelModal(true);
  };

  const executeCancelVacation = async () => {
    if (!confirmCancelId) return;

    setShowCancelModal(false);
    setVacationSubmitting(true);
    setVacationError("");
    setVacationSuccess("");

    try {
      const res = await cancelVacation(customer.id, confirmCancelId);
      setVacationSubmitting(false);

      if (res.success) {
        setVacationSuccess("Deliveries resumed successfully!");
        router.refresh();
      } else {
        setVacationError(res.error || "Failed to cancel vacation.");
      }
    } catch (err: any) {
      setVacationSubmitting(false);
      setVacationError(err.message || "An error occurred.");
    } finally {
      setConfirmCancelId(null);
    }
  };

  // Group vacations into active/upcoming vs past
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const activeOrUpcomingVacations = vacations.filter((v) => {
    const end = new Date(v.endDate);
    end.setHours(0, 0, 0, 0);
    return end >= now;
  });

  const pastVacations = vacations.filter((v) => {
    const end = new Date(v.endDate);
    end.setHours(0, 0, 0, 0);
    return end < now;
  });

  return (
    <div className="vacation-container">
      <div className="vacation-grid">
        {/* Left Side: Schedule Form */}
        <div className="vacation-form-panel card">
          <h3>Schedule Vacation Pause</h3>
          <p className="text-muted">Pause all subscription deliveries for a specific range of days. Your wallet will not be charged during this period.</p>

          {vacationError && <div className="badge badge-danger mb-4 block-alert">{vacationError}</div>}
          {vacationSuccess && <div className="badge badge-success mb-4 block-alert">{vacationSuccess}</div>}

          <form onSubmit={handleVacationSubmit} className="mt-6">
            {/* Floating label for Start Date */}
            <div className={`floating-form-group ${focusStart || vacationStart ? "focused" : ""}`}>
              <label className="floating-label active-float">Vacation Start Date</label>
              <input
                type="date"
                className="form-input floating-input"
                value={vacationStart}
                onChange={(e) => setVacationStart(e.target.value)}
                onFocus={() => setFocusStart(true)}
                onBlur={() => setFocusStart(false)}
                disabled={vacationSubmitting}
                required
              />
            </div>

            {/* Floating label for End Date */}
            <div className={`floating-form-group ${focusEnd || vacationEnd ? "focused" : ""}`}>
              <label className="floating-label active-float">Vacation End Date</label>
              <input
                type="date"
                className="form-input floating-input"
                value={vacationEnd}
                onChange={(e) => setVacationEnd(e.target.value)}
                onFocus={() => setFocusEnd(true)}
                onBlur={() => setFocusEnd(false)}
                disabled={vacationSubmitting}
                required
              />
            </div>

            {/* Floating label for Reason */}
            <div className={`floating-form-group ${focusReason || reason ? "focused" : ""}`}>
              <label className="floating-label select-label">Reason for Vacation (Optional)</label>
              <select
                className="form-input floating-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onFocus={() => setFocusReason(true)}
                onBlur={() => setFocusReason(false)}
                disabled={vacationSubmitting}
              >
                <option value="">Select a reason...</option>
                <option value="traveling">✈️ Traveling / Out of Town</option>
                <option value="health">🏥 Health Reasons</option>
                <option value="seasonal">❄️ Seasonal Pause</option>
                <option value="other">⚙️ Other</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-6" disabled={vacationSubmitting}>
              {vacationSubmitting ? "Scheduling Vacation..." : "Go on Vacation ✈️"}
            </button>
          </form>
        </div>

        {/* Right Side: Timeline and list */}
        <div className="vacation-lists-panel">
          {/* Active & Upcoming Vacations Timeline */}
          <div className="card mb-6">
            <h3>Vacation Timeline</h3>
            <p className="text-muted">Visual track of your scheduled vacation pauses.</p>

            <div className="timeline-wrapper mt-6">
              {activeOrUpcomingVacations.length === 0 ? (
                <p className="no-records text-muted">No active or upcoming vacations scheduled.</p>
              ) : (
                <div className="vertical-timeline">
                  {activeOrUpcomingVacations.map((v, index) => {
                    const start = new Date(v.startDate);
                    const end = new Date(v.endDate);
                    const isActive = start <= now && end >= now;

                    return (
                      <div key={v.id} className="timeline-node">
                        <div className="timeline-badge-column">
                          <div className={`timeline-dot ${isActive ? "active" : ""}`}></div>
                          {index < activeOrUpcomingVacations.length - 1 && <div className="timeline-line"></div>}
                        </div>
                        
                        <div className="timeline-content-card">
                          <div className="timeline-date-range">
                            {start.toLocaleDateString([], {month:'short', day:'numeric'})} — {end.toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'})}
                          </div>
                          
                          <div className="timeline-status-badge">
                            {isActive ? (
                              <span className="badge badge-success">Active Now</span>
                            ) : (
                              <span className="badge badge-warning">Upcoming</span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => triggerCancelConfirm(v.id)}
                            disabled={vacationSubmitting}
                            className="btn btn-outline btn-sm resume-early-btn mt-2"
                          >
                            {isActive ? "Resume Early 🔌" : "Cancel Plan ❌"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Historical Log */}
          <div className="card">
            <h3>Past Vacations</h3>
            <p className="text-muted">A record of your completed vacation pauses.</p>

            <div className="vacation-list-history mt-4">
              {pastVacations.length === 0 ? (
                <p className="no-records text-muted">No past vacations found.</p>
              ) : (
                pastVacations.map((v) => {
                  const start = new Date(v.startDate);
                  const end = new Date(v.endDate);
                  return (
                    <div key={v.id} className="history-row">
                      <span className="history-check">✓</span>
                      <div>
                        <strong>{start.toLocaleDateString()} to {end.toLocaleDateString()}</strong>
                        <p className="text-muted">Completed pause period.</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Confirm Delivery Resumption</h3>
            <p>Are you sure you want to end this vacation pause early? Deliveries will resume starting tomorrow morning (subject to standard 10:00 PM cutoff time).</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowCancelModal(false)}>
                Go Back
              </button>
              <button className="btn btn-primary" onClick={executeCancelVacation}>
                Confirm Resumption
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .vacation-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .vacation-grid {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 32px;
          align-items: flex-start;
        }

        .mb-6 {
          margin-bottom: 24px;
        }

        /* Floating labels */
        .floating-form-group {
          position: relative;
          margin-bottom: 20px;
        }

        .floating-label {
          position: absolute;
          left: 16px;
          top: 14px;
          font-size: 14px;
          color: var(--text-muted);
          pointer-events: none;
          transition: transform 0.2s, font-size 0.2s, color 0.2s;
        }

        .floating-input {
          padding-top: 20px;
          padding-bottom: 6px;
        }

        /* date and selects labels need to float immediately */
        .floating-form-group.focused .floating-label,
        .floating-form-group .floating-label.active-float,
        .floating-form-group .floating-label.select-label {
          transform: translateY(-8px) scale(0.85);
          transform-origin: top left;
          color: var(--primary-color);
        }

        /* Timeline styling */
        .timeline-wrapper {
          display: flex;
          flex-direction: column;
        }

        .vertical-timeline {
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: relative;
          padding-left: 8px;
        }

        .timeline-node {
          display: flex;
          gap: 16px;
        }

        .timeline-badge-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .timeline-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--border-color);
          border: 3px solid var(--bg-card);
          z-index: 2;
        }

        .timeline-dot.active {
          background: var(--primary-color);
          box-shadow: 0 0 0 4px var(--primary-light);
        }

        .timeline-line {
          position: absolute;
          top: 14px;
          bottom: -24px;
          width: 2px;
          background: var(--border-color);
          z-index: 1;
        }

        .timeline-content-card {
          flex: 1;
          background: var(--border-light);
          border: 1px solid var(--border-color);
          padding: 16px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .timeline-date-range {
          font-weight: 700;
          font-size: 15px;
          color: var(--text-main);
        }

        .timeline-status-badge {
          align-self: flex-start;
        }

        .resume-early-btn {
          align-self: flex-start;
          font-size: 11px;
          padding: 6px 12px;
          border-radius: 6px;
        }

        /* Historical Log styling */
        .vacation-list-history {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .history-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px dashed var(--border-light);
        }

        .history-row:last-child {
          border-bottom: none;
        }

        .history-check {
          color: var(--primary-color);
          background: var(--primary-light);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }

        .no-records {
          font-size: 13px;
          font-style: italic;
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
          .vacation-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
