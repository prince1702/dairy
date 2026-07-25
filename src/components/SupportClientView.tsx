"use client";

import React, { useState, useEffect } from "react";
import { submitSupportTicket } from "@/app/customer-actions";

interface SupportClientViewProps {
  customer: {
    id: string;
    name: string;
    email: string;
  };
}

interface LocalTicket {
  id: string;
  subject: string;
  message: string;
  status: "PENDING" | "SOLVED";
  createdAt: string;
}

export function SupportClientView({ customer }: SupportClientViewProps) {
  // Ticket Form state
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Focus states
  const [focusSubject, setFocusSubject] = useState(false);
  const [focusMessage, setFocusMessage] = useState(false);

  // Local ticket history state
  const [tickets, setTickets] = useState<LocalTicket[]>([]);

  // FAQ Expand state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Load simulated tickets from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`customer_support_tickets_${customer.id}`);
    if (saved) {
      try {
        setTickets(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [customer.id]);

  const saveLocalTickets = (newTickets: LocalTicket[]) => {
    setTickets(newTickets);
    localStorage.setItem(
      `customer_support_tickets_${customer.id}`,
      JSON.stringify(newTickets)
    );
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) {
      setErrorMsg("Please enter both a subject and a message description.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await submitSupportTicket(customer.id, ticketSubject, ticketMessage);
      setSubmitting(false);

      if (res.success) {
        setSuccessMsg("Support ticket raised successfully! Our admin team has been notified.");
        
        // Add to simulated local tickets history
        const newTicket: LocalTicket = {
          id: Math.random().toString(36).substr(2, 9),
          subject: ticketSubject,
          message: ticketMessage,
          status: "PENDING",
          createdAt: new Date().toISOString(),
        };
        saveLocalTickets([newTicket, ...tickets]);

        setTicketSubject("");
        setTicketMessage("");
      } else {
        setErrorMsg(res.error || "Failed to submit support ticket.");
      }
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err.message || "An unexpected error occurred.");
    }
  };

  const toggleFaq = (idx: number) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: "What is the cutoff time for modifying tomorrow's deliveries?",
      a: "The daily cutoff time is 10:00 PM. Any overrides, skips, vacation schedules, or pause toggles must be saved before 10:00 PM today to apply tomorrow morning.",
    },
    {
      q: "How does the wallet auto-deduction work?",
      a: "After our delivery drivers complete morning drops (around 5:00 AM - 7:00 AM), the system automatically deducts the cost of the delivered items from your wallet. Please maintain at least ₹150 balance to prevent delivery blocks.",
    },
    {
      q: "Can I receive different items tomorrow without changing my baseline?",
      a: "Yes! Use the 'Tomorrow Changes' page to override quantities for tomorrow's order only. Your baseline schedule (recurring quantity) will automatically restore the day after tomorrow.",
    },
    {
      q: "How do I uploader recharge screenshots?",
      a: "Go to the 'Recharge Wallet' page, enter the amount you transferred, drag or upload the receipt screenshot file, and submit. An administrator will review and credit the amount to your wallet balance within a few hours.",
    },
  ];

  return (
    <div className="support-container">
      <div className="support-grid">
        
        {/* Left Side: FAQs & Direct Contact Channels */}
        <div className="support-info-panel">
          
          {/* Accordion FAQ Card */}
          <div className="card">
            <h3>Frequently Asked Questions</h3>
            <p className="text-muted">Quick solutions to common queries regarding deliveries and budgets.</p>

            <div className="faq-accordion mt-6">
              {faqs.map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div key={idx} className={`faq-node ${isOpen ? "open" : ""}`}>
                    <button
                      className="faq-question-btn"
                      onClick={() => toggleFaq(idx)}
                      type="button"
                      aria-expanded={isOpen}
                    >
                      <span>❓ {faq.q}</span>
                      <span className="accordion-arrow">{isOpen ? "▲" : "▼"}</span>
                    </button>
                    
                    <div className="faq-answer-drawer">
                      <p>{faq.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Contact Card */}
          <div className="card mt-6">
            <h3>Contact Administrator</h3>
            <p className="text-muted">Reach out directly to our management support team for any billing inquiries.</p>

            <div className="contact-channels-grid mt-6">
              <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" className="contact-btn-item whatsapp">
                <span className="contact-icon">💬</span>
                <strong>WhatsApp Support</strong>
                <p>Chat directly with admin</p>
              </a>

              <a href="tel:+919999999999" className="contact-btn-item phone">
                <span className="contact-icon">📞</span>
                <strong>Call Support</strong>
                <p>Talk to our manager</p>
              </a>

              <a href="mailto:support@bhagwati.com" className="contact-btn-item email">
                <span className="contact-icon">✉️</span>
                <strong>Email Support</strong>
                <p>Send billing queries</p>
              </a>
            </div>
          </div>
        </div>

        {/* Right Side: Raise Ticket Form & Simulated Ticket History */}
        <div className="support-ticket-panel">
          
          {/* Raise Ticket Form */}
          <div className="card mb-6">
            <h3>Raise Support Ticket</h3>
            <p className="text-muted">Submit a ticket directly to our admin team. We will review it shortly.</p>

            {errorMsg && <div className="badge badge-danger mb-4 block-alert">{errorMsg}</div>}
            {successMsg && <div className="badge badge-success mb-4 block-alert">{successMsg}</div>}

            <form onSubmit={handleTicketSubmit} className="mt-6">
              
              {/* Floating label Subject */}
              <div className={`floating-form-group ${focusSubject || ticketSubject ? "focused" : ""}`}>
                <label className="floating-label" htmlFor="ticket-subject">Ticket Subject</label>
                <input
                  id="ticket-subject"
                  type="text"
                  className="form-input floating-input"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  onFocus={() => setFocusSubject(true)}
                  onBlur={() => setFocusSubject(false)}
                  disabled={submitting}
                  required
                />
              </div>

              {/* Floating label Message */}
              <div className={`floating-form-group mt-4 ${focusMessage || ticketMessage ? "focused" : ""}`}>
                <label className="floating-label" htmlFor="ticket-message">Describe your issue</label>
                <textarea
                  id="ticket-message"
                  className="form-input floating-input textarea-field"
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  onFocus={() => setFocusMessage(true)}
                  onBlur={() => setFocusMessage(false)}
                  disabled={submitting}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary w-full mt-6" disabled={submitting}>
                {submitting ? "Submitting Ticket..." : "Submit Support Ticket"}
              </button>
            </form>
          </div>

          {/* Simulated Ticket History list */}
          <div className="card">
            <h3>Ticket History</h3>
            <p className="text-muted">Status tracking of support requests raised by you.</p>

            <div className="ticket-history-list mt-4">
              {tickets.length === 0 ? (
                <p className="empty-text text-muted">No support tickets submitted yet.</p>
              ) : (
                tickets.map((t) => {
                  const date = new Date(t.createdAt);
                  return (
                    <div key={t.id} className="ticket-history-row">
                      <div className="ticket-details-box">
                        <strong>{t.subject}</strong>
                        <p className="text-muted">{t.message}</p>
                        <span className="ticket-date text-muted">
                          Raised on {date.toLocaleDateString()} at {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <span className={`badge status-${t.status.toLowerCase()}`}>
                        {t.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .support-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .support-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 32px;
          align-items: flex-start;
        }

        .mb-6 {
          margin-bottom: 24px;
        }

        /* Accordion FAQ styling */
        .faq-accordion {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .faq-node {
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-card);
          overflow: hidden;
          transition: all 0.2s;
        }

        .faq-node.open {
          border-color: var(--primary-color);
          box-shadow: 0 4px 8px var(--shadow-color);
        }

        .faq-question-btn {
          width: 100%;
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: transparent;
          border: none;
          color: var(--text-main);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          text-align: left;
        }

        .accordion-arrow {
          font-size: 11px;
          color: var(--text-muted);
        }

        .faq-answer-drawer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
          background: var(--border-light);
          padding: 0 16px;
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-muted);
        }

        .faq-node.open .faq-answer-drawer {
          max-height: 150px;
          padding: 12px 16px;
          border-top: 1px solid var(--border-color);
        }

        /* Quick contact channels */
        .contact-channels-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 16px;
        }

        .contact-btn-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          border-radius: 12px;
          text-decoration: none;
          text-align: center;
          box-shadow: 0 2px 4px var(--shadow-color);
          border: 1px solid var(--border-color);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .contact-btn-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px var(--shadow-color);
        }

        .contact-btn-item.whatsapp { background: #e8f5ee; color: #1e7044; border-color: #c7ebda; }
        .contact-btn-item.phone { background: #eff6ff; color: #1e40af; border-color: #dbeafe; }
        .contact-btn-item.email { background: #faf5ff; color: #6b21a8; border-color: #f3e8ff; }

        .contact-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .contact-btn-item strong {
          font-size: 13px;
        }

        .contact-btn-item p {
          font-size: 10px;
          opacity: 0.9;
          margin-top: 2px;
        }

        /* Floating label form fields */
        .floating-form-group {
          position: relative;
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

        .textarea-field {
          min-height: 100px;
          resize: vertical;
        }

        .floating-form-group.focused .floating-label,
        .floating-form-group .floating-input:not([value=""]) + .floating-label {
          transform: translateY(-8px) scale(0.85);
          transform-origin: top left;
          color: var(--primary-color);
        }

        /* Ticket history log list */
        .ticket-history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 300px;
          overflow-y: auto;
        }

        .ticket-history-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 12px;
          background: var(--border-light);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          gap: 16px;
        }

        .ticket-details-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .ticket-details-box strong {
          font-size: 14px;
          color: var(--text-main);
        }

        .ticket-details-box p {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .ticket-date {
          font-size: 10px;
        }

        /* Badge status */
        .badge.status-pending {
          background: var(--accent-light);
          color: #B25E00;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: 20px;
          white-space: nowrap;
        }

        .badge.status-solved {
          background: var(--primary-light);
          color: var(--primary-color);
          font-size: 10px;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: 20px;
          white-space: nowrap;
        }

        .empty-text {
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
          .support-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
