"use client";

import React, { useState } from "react";
import { submitSupportTicket } from "@/app/customer-actions";

interface SupportClientViewProps {
  customer: {
    id: string;
    name: string;
    email: string;
  };
}

export function SupportClientView({ customer }: SupportClientViewProps) {
  // Ticket form state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [ticketError, setTicketError] = useState("");

  // FAQ Expandable State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "When are daily morning deliveries completed?",
      answer: "Our deliveries are completed silently at your doorstep between 5:00 AM and 7:00 AM. In case of issues, please report them in your portal or contact us.",
    },
    {
      question: "What is the daily cutoff time for order modifications?",
      answer: "The daily cutoff time is 10:00 PM on the night before delivery. Any quantity overrides or pause requests submitted after 10:00 PM will only apply to deliveries scheduled for the day after tomorrow.",
    },
    {
      question: "How does the wallet recharge system work?",
      answer: "Recharging is a 2-step process. First, make a payment of the desired amount via UPI (GPay/PhonePe) or NetBanking to our account. Second, submit a Recharge Request in the portal by entering the amount and uploading the transaction receipt screenshot. Once verified, the balance will be credited to your wallet.",
    },
    {
      question: "What is the difference between Daily Pause and Vacation Mode?",
      answer: "Daily Pause is designed for a single-day skip (e.g. you don't need milk tomorrow). Vacation Mode is designed for a range of multiple consecutive days (e.g. you are going out of town for a week). Both actions must be submitted before the 10:00 PM cutoff.",
    },
    {
      question: "How do I report a delivery issue?",
      answer: "If you did not receive a delivery or received damaged goods, please raise a ticket immediately using the form on this page, or contact our support team directly via WhatsApp or phone call.",
    },
  ];

  const toggleFaq = (index: number) => {
    if (expandedFaq === index) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(index);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setTicketError("Please fill out both the subject and the message.");
      return;
    }

    setTicketSubmitting(true);
    setTicketError("");
    setTicketSuccess(false);

    try {
      const res = await submitSupportTicket(customer.id, subject, message);
      setTicketSubmitting(false);

      if (res.success) {
        setTicketSuccess(true);
        setSubject("");
        setMessage("");
        setTimeout(() => setTicketSuccess(false), 5000);
      } else {
        setTicketError(res.error || "Failed to submit support ticket.");
      }
    } catch (err: any) {
      setTicketSubmitting(false);
      setTicketError(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="support-container">
      <div className="support-grid">
        {/* Left Side: FAQ and Contacts */}
        <div className="support-info-panel">
          {/* FAQ Accordion */}
          <div className="card mb-6">
            <h3>Frequently Asked Questions (FAQ)</h3>
            <p className="text-muted">Quick answers to common questions about subscriptions, wallets, and cutoff times.</p>

            <div className="faq-list mt-6">
              {faqs.map((faq, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <div key={idx} className="faq-item">
                    <button className="faq-question-btn" onClick={() => toggleFaq(idx)}>
                      <span>{faq.question}</span>
                      <span className="faq-arrow">{isExpanded ? "▲" : "▼"}</span>
                    </button>
                    {isExpanded && (
                      <div className="faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact Admin */}
          <div className="card">
            <h3>Direct Contact Support</h3>
            <p className="text-muted">Speak directly with our customer support administrators.</p>

            <div className="contacts-grid mt-6">
              <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" className="contact-card whatsapp">
                <span className="contact-icon">💬</span>
                <strong>Chat on WhatsApp</strong>
                <p className="text-muted">+91 99999 99999</p>
              </a>

              <a href="tel:+919999999999" className="contact-card phone">
                <span className="contact-icon">📞</span>
                <strong>Call Support</strong>
                <p className="text-muted">+91 99999 99999</p>
              </a>

              <a href="mailto:support@bhagwatiex.com" className="contact-card email">
                <span className="contact-icon">✉️</span>
                <strong>Email Helpdesk</strong>
                <p className="text-muted">support@bhagwatiex.com</p>
              </a>
            </div>
          </div>
        </div>

        {/* Right Side: Raise Support Ticket form */}
        <div className="support-form-panel card">
          <h3>Raise a Support Ticket</h3>
          <p className="text-muted">Submit an online ticket, and our team will get back to you within 24 hours.</p>

          {ticketError && <div className="badge badge-danger mb-4 block-alert">{ticketError}</div>}
          {ticketSuccess && <div className="badge badge-success mb-4 block-alert">Support ticket submitted successfully! Check notifications for updates.</div>}

          <form onSubmit={handleTicketSubmit} className="mt-4">
            <div className="form-group">
              <label className="form-label">Ticket Subject</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Delivery issue on July 25, Wallet balance discrepancy"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={ticketSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Message</label>
              <textarea
                className="form-input message-textarea"
                rows={6}
                placeholder="Explain your concern in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={ticketSubmitting}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4" disabled={ticketSubmitting}>
              {ticketSubmitting ? "Submitting Ticket..." : "Submit Support Ticket"}
            </button>
          </form>
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
          grid-template-columns: 1.3fr 1fr;
          gap: 32px;
          align-items: flex-start;
        }

        .mb-6 {
          margin-bottom: 24px;
        }

        /* FAQ Styling */
        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .faq-item {
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-card);
        }

        .faq-question-btn {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: transparent;
          border: none;
          color: var(--text-main);
          font-weight: 600;
          font-size: 14px;
          text-align: left;
          cursor: pointer;
        }

        .faq-question-btn:hover {
          background: var(--border-light);
        }

        .faq-arrow {
          font-size: 10px;
          color: var(--text-muted);
        }

        .faq-answer {
          padding: 16px;
          background: var(--border-light);
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-muted);
          border-top: 1px solid var(--border-color);
        }

        /* Contact cards grid */
        .contacts-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .contact-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          text-decoration: none;
          transition: all 0.2s;
        }

        .contact-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px var(--shadow-color);
        }

        .contact-card.whatsapp:hover {
          border-color: #25D366;
          background: rgba(37, 211, 102, 0.05);
        }

        .contact-card.phone:hover {
          border-color: var(--primary-color);
          background: var(--primary-light);
        }

        .contact-card.email:hover {
          border-color: #3B82F6;
          background: rgba(59, 130, 246, 0.05);
        }

        .contact-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--border-light);
          border-radius: 50%;
        }

        .contact-card strong {
          font-size: 14px;
          color: var(--text-main);
        }

        .contact-card p {
          font-size: 12px;
          margin-left: auto;
        }

        /* Form details */
        .message-textarea {
          resize: vertical;
          font-family: inherit;
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
          .contact-card p {
            margin-left: unset;
          }
        }
      `}</style>
    </div>
  );
}
