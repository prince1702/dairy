"use client";

import React, { useState } from "react";
import { createPaymentRequest } from "@/app/actions";
import { uploadScreenshot } from "@/lib/upload";
import { useRouter } from "next/navigation";

interface RechargeRecord {
  id: string;
  amount: number;
  screenshotUrl: string;
  status: string;
  createdAt: string;
}

interface RechargeWalletClientViewProps {
  customer: {
    id: string;
    name: string;
    email: string;
  };
  paymentRequests: RechargeRecord[];
}

export function RechargeWalletClientView({
  customer,
  paymentRequests,
}: RechargeWalletClientViewProps) {
  const router = useRouter();

  // Recharge State
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rechargeSubmitting, setRechargeSubmitting] = useState(false);
  const [rechargeSuccess, setRechargeSuccess] = useState(false);
  const [rechargeError, setRechargeError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setScreenshotFile(file);

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rechargeAmount || isNaN(Number(rechargeAmount)) || Number(rechargeAmount) <= 0) {
      setRechargeError("Please enter a valid recharge amount.");
      return;
    }
    if (!screenshotFile) {
      setRechargeError("Please select a screenshot of the payment receipt.");
      return;
    }

    setRechargeSubmitting(true);
    setRechargeError("");
    setRechargeSuccess(false);

    try {
      const screenshotUrl = await uploadScreenshot(screenshotFile);
      const res = await createPaymentRequest(
        customer.id,
        Number(rechargeAmount),
        screenshotUrl
      );

      if (res.success) {
        setRechargeSuccess(true);
        setRechargeAmount("");
        setScreenshotFile(null);
        setPreviewUrl(null);
        const fileInput = document.getElementById("receipt-file") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        router.refresh();
      } else {
        setRechargeError(res.error || "Failed to submit request.");
      }
    } catch (err: any) {
      setRechargeError(err.message || "An error occurred during submission.");
    } finally {
      setRechargeSubmitting(false);
    }
  };

  return (
    <div className="recharge-container">
      <div className="recharge-grid">
        {/* Left Side: Submit Request form */}
        <div className="recharge-form-card card">
          <h3>Request Balance Recharge</h3>
          <p className="text-muted">Enter the transfer amount and upload the screenshot of your payment receipt (GPay, PhonePe, Paytm, or NetBanking).</p>

          {rechargeError && <div className="badge badge-danger mb-4 block-alert">{rechargeError}</div>}
          {rechargeSuccess && <div className="badge badge-success mb-4 block-alert">Recharge request submitted successfully! Pending admin approval.</div>}

          <form onSubmit={handleRechargeSubmit} className="mt-4">
            <div className="form-group">
              <label className="form-label" htmlFor="amount">Recharge Amount (₹)</label>
              <input
                id="amount"
                type="number"
                className="form-input"
                placeholder="e.g. 500"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                disabled={rechargeSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="receipt-file">Upload Payment Screenshot</label>
              <input
                id="receipt-file"
                type="file"
                accept="image/*"
                className="form-input"
                onChange={handleFileChange}
                disabled={rechargeSubmitting}
                required
              />
              <span className="file-hint text-muted">Please provide a valid transaction receipt screenshot.</span>
            </div>

            {/* Local Image Preview */}
            {previewUrl && (
              <div className="screenshot-preview-box">
                <span className="preview-label">Receipt Image Preview</span>
                <div className="preview-img-container">
                  <img src={previewUrl} alt="Payment Receipt Preview" />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full mt-4" disabled={rechargeSubmitting}>
              {rechargeSubmitting ? "Submitting screenshot..." : "Submit Receipt Screenshot"}
            </button>
          </form>
        </div>

        {/* Right Side: Requests history */}
        <div className="recharge-history-card card">
          <h3>Recharge History</h3>
          <p className="text-muted">Review approvals or rejections of your recent top-up requests.</p>

          <div className="history-table-wrapper mt-4">
            {paymentRequests.length === 0 ? (
              <p className="empty-text text-center py-6 text-muted">No recharge requests submitted yet.</p>
            ) : (
              <table className="recharge-history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Receipt</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRequests.map((req) => (
                    <tr key={req.id}>
                      <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td><strong>₹{req.amount.toFixed(2)}</strong></td>
                      <td>
                        <a href={req.screenshotUrl} target="_blank" rel="noreferrer" className="receipt-link">
                          View Receipt 🔗
                        </a>
                      </td>
                      <td>
                        <span className={`badge status-${req.status.toLowerCase()}`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .recharge-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .recharge-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 32px;
          align-items: flex-start;
        }

        .file-hint {
          display: block;
          font-size: 11px;
          margin-top: 4px;
        }

        /* Screenshot Preview styling */
        .screenshot-preview-box {
          margin-top: 16px;
          background: var(--border-light);
          padding: 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .preview-label {
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          display: block;
          margin-bottom: 8px;
        }

        .preview-img-container {
          max-height: 250px;
          overflow: hidden;
          border-radius: 6px;
          display: flex;
          justify-content: center;
          background: #000;
        }

        .preview-img-container img {
          max-width: 100%;
          max-height: 250px;
          object-fit: contain;
        }

        /* History table styling */
        .history-table-wrapper {
          overflow-x: auto;
        }

        .recharge-history-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 14px;
        }

        .recharge-history-table th, .recharge-history-table td {
          padding: 12px;
          border-bottom: 1px solid var(--border-light);
        }

        .recharge-history-table th {
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
        }

        .receipt-link {
          color: var(--primary-color);
          text-decoration: none;
          font-weight: 600;
          font-size: 13px;
        }

        .receipt-link:hover {
          text-decoration: underline;
        }

        /* Status colors */
        .badge.status-pending {
          background: var(--accent-light);
          color: #B25E00;
          font-size: 11px;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .badge.status-approved {
          background: var(--primary-light);
          color: var(--primary-color);
          font-size: 11px;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .badge.status-rejected {
          background: var(--danger-light);
          color: var(--danger-color);
          font-size: 11px;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .empty-text {
          font-size: 14px;
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
          .recharge-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
