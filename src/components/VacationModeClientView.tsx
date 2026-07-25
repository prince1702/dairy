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

  const handleCancelVacation = async (vacationId: string) => {
    if (!confirm("Are you sure you want to resume deliveries?")) return;

    setVacationSubmitting(true);
    setVacationError("");
    setVacationSuccess("");

    try {
      const res = await cancelVacation(customer.id, vacationId);
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

          <form onSubmit={handleVacationSubmit} className="mt-4">
            <div className="form-group">
              <label className="form-label">Vacation Start Date</label>
              <input
                type="date"
                className="form-input"
                value={vacationStart}
                onChange={(e) => setVacationStart(e.target.value)}
                disabled={vacationSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vacation End Date</label>
              <input
                type="date"
                className="form-input"
                value={vacationEnd}
                onChange={(e) => setVacationEnd(e.target.value)}
                disabled={vacationSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reason for Vacation (Optional)</label>
              <select
                className="form-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={vacationSubmitting}
              >
                <option value="">Select a reason...</option>
                <option value="traveling">Traveling / Out of Town</option>
                <option value="health">Health Reasons</option>
                <option value="seasonal">Seasonal Pause</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4" disabled={vacationSubmitting}>
              {vacationSubmitting ? "Scheduling Vacation..." : "Go on Vacation ✈️"}
            </button>
          </form>
        </div>

        {/* Right Side: Vacation lists */}
        <div className="vacation-lists-panel">
          {/* Active & Upcoming Vacations */}
          <div className="card mb-6">
            <h3>Upcoming & Active Vacations</h3>
            <p className="text-muted">Scheduled periods where deliveries are suspended.</p>

            <div className="vacation-list mt-4">
              {activeOrUpcomingVacations.length === 0 ? (
                <p className="no-records text-muted">No active or upcoming vacations scheduled.</p>
              ) : (
                activeOrUpcomingVacations.map((v) => {
                  const start = new Date(v.startDate);
                  const end = new Date(v.endDate);
                  const isActive = start <= now && end >= now;

                  return (
                    <div key={v.id} className="vacation-item-card">
                      <div className="vacation-item-details">
                        <div className="date-range">
                          📅 {start.toLocaleDateString()} — {end.toLocaleDateString()}
                        </div>
                        <div className="vacation-status-badge">
                          {isActive ? (
                            <span className="badge badge-success">Active Now</span>
                          ) : (
                            <span className="badge badge-warning">Upcoming</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCancelVacation(v.id)}
                        disabled={vacationSubmitting}
                        className="btn btn-outline btn-sm btn-resume"
                      >
                        {isActive ? "Resume Early 🔌" : "Cancel Plan ❌"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Vacation History */}
          <div className="card">
            <h3>Vacation History</h3>
            <p className="text-muted">Record of your past vacation pauses.</p>

            <div className="vacation-list mt-4">
              {pastVacations.length === 0 ? (
                <p className="no-records text-muted">No historical vacation records found.</p>
              ) : (
                pastVacations.map((v) => {
                  const start = new Date(v.startDate);
                  const end = new Date(v.endDate);

                  return (
                    <div key={v.id} className="vacation-history-row">
                      <span className="calendar-check">✓</span>
                      <div>
                        <strong>{start.toLocaleDateString()} to {end.toLocaleDateString()}</strong>
                        <p className="text-muted" style={{ fontSize: "11px" }}>Completed</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .vacation-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .vacation-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 32px;
          align-items: flex-start;
        }

        .mb-6 {
          margin-bottom: 24px;
        }

        .vacation-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .no-records {
          font-size: 13px;
          font-style: italic;
          padding: 12px 0;
        }

        .vacation-item-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--border-light);
          padding: 16px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .vacation-item-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .date-range {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-main);
        }

        .vacation-status-badge {
          align-self: flex-start;
        }

        .btn-resume {
          padding: 6px 12px;
          font-size: 11px;
          border-radius: 6px;
        }

        /* History items */
        .vacation-history-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px dashed var(--border-light);
        }

        .vacation-history-row:last-child {
          border-bottom: none;
        }

        .calendar-check {
          color: var(--primary-color);
          background: var(--primary-light);
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: bold;
          font-size: 12px;
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
