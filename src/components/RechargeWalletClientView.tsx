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

  // Recharge state
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rechargeSubmitting, setRechargeSubmitting] = useState(false);
  const [rechargeSuccess, setRechargeSuccess] = useState(false);
  const [rechargeError, setRechargeError] = useState("");

  // Drag and Drop active indicator
  const [isDragActive, setIsDragActive] = useState(false);

  // Floating label active states
  const [isAmountFocused, setIsAmountFocused] = useState(false);

  const amountPresets = [200, 500, 1000, 2000];

  const handleFileChange = (file: File | null) => {
    setScreenshotFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileChange(file);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const selectPresetAmount = (val: number) => {
    setRechargeAmount(String(val));
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
        {/* Left Side: Submit Request */}
        <div className="recharge-form-card card">
          <h3>Request Balance Recharge</h3>
          <p className="text-muted">Transfer your recharge amount via UPI or NetBanking, then upload the receipt below.</p>

          {rechargeError && <div className="badge badge-danger mb-4 block-alert animation-shake">{rechargeError}</div>}
          {rechargeSuccess && <div className="badge badge-success mb-4 block-alert animation-bounce">Recharge request submitted! Pending approval.</div>}

          <form onSubmit={handleRechargeSubmit} className="mt-6">
            {/* Amount input with Floating label */}
            <div className={`floating-form-group ${isAmountFocused || rechargeAmount ? "focused" : ""}`}>
              <label className="floating-label" htmlFor="amount">Recharge Amount (₹)</label>
              <input
                id="amount"
                type="number"
                className="form-input floating-input"
                placeholder=""
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                onFocus={() => setIsAmountFocused(true)}
                onBlur={() => setIsAmountFocused(false)}
                disabled={rechargeSubmitting}
                required
              />
            </div>

            {/* Quick Amount presets */}
            <div className="presets-row mt-2">
              {amountPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`preset-btn ${Number(rechargeAmount) === preset ? "selected" : ""}`}
                  onClick={() => selectPresetAmount(preset)}
                  disabled={rechargeSubmitting}
                >
                  +₹{preset}
                </button>
              ))}
            </div>

            {/* Drag & Drop File Zone */}
            <div className="form-group mt-6">
              <label className="form-label-title">Upload Payment Screenshot</label>
              
              <div
                className={`drag-drop-zone ${isDragActive ? "drag-active" : ""} ${screenshotFile ? "has-file" : ""}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("receipt-file")?.click()}
              >
                <input
                  id="receipt-file"
                  type="file"
                  accept="image/*"
                  className="hidden-file-input"
                  onChange={handleFileInputChange}
                  disabled={rechargeSubmitting}
                />
                
                <span className="zone-icon">{screenshotFile ? "📸" : "📤"}</span>
                <span className="zone-text">
                  {screenshotFile ? (
                    <strong>{screenshotFile.name}</strong>
                  ) : (
                    "Drag and drop payment receipt here, or click to browse files"
                  )}
                </span>
                <span className="zone-subtext text-muted">Supports JPG, PNG, WEBP (Max 5MB)</span>
              </div>
            </div>

            {/* Local Image Preview */}
            {previewUrl && (
              <div className="screenshot-preview-card mt-4">
                <span className="preview-label">Receipt Image Preview</span>
                <div className="preview-image-cropper">
                  <img src={previewUrl} alt="Payment Receipt Screenshot" />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full mt-6 btn-loader-parent" disabled={rechargeSubmitting}>
              {rechargeSubmitting ? (
                <>
                  <span className="button-spinner"></span>
                  Submitting Screenshot...
                </>
              ) : (
                "Submit Receipt Screenshot"
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Requests history */}
        <div className="recharge-history-card card">
          <h3>Recharge History Log</h3>
          <p className="text-muted">Audit log of your submitted balance top-up requests.</p>

          <div className="history-table-wrapper mt-4">
            {paymentRequests.length === 0 ? (
              <p className="empty-text text-center py-6 text-muted">No recharge requests submitted yet.</p>
            ) : (
              <table className="recharge-history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Receipt screenshot</th>
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
          grid-template-columns: 1fr 1.3fr;
          gap: 32px;
          align-items: flex-start;
        }

        /* Floating label styling */
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

        .floating-form-group.focused .floating-label,
        .floating-form-group .floating-input:not([value=""]) + .floating-label {
          transform: translateY(-8px) scale(0.85);
          transform-origin: top left;
          color: var(--primary-color);
        }

        /* Presets Amount styling */
        .presets-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .preset-btn {
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          color: var(--text-main);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preset-btn:hover {
          border-color: var(--primary-color);
          background: var(--primary-light);
          color: var(--primary-color);
        }

        .preset-btn.selected {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        /* Drag drop zone */
        .form-label-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 6px;
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .drag-drop-zone {
          border: 2px dashed var(--border-color);
          border-radius: 12px;
          padding: 24px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          background: var(--border-light);
          transition: all 0.2s ease;
        }

        .drag-drop-zone:hover, .drag-drop-zone.drag-active {
          border-color: var(--primary-color);
          background: var(--primary-light);
        }

        .drag-drop-zone.has-file {
          border-style: solid;
          border-color: var(--primary-color);
        }

        .hidden-file-input {
          display: none;
        }

        .zone-icon {
          font-size: 28px;
        }

        .zone-text {
          font-size: 13px;
          color: var(--text-main);
        }

        .zone-subtext {
          font-size: 11px;
        }

        /* Screenshot Preview Card */
        .screenshot-preview-card {
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

        .preview-image-cropper {
          max-height: 200px;
          overflow: hidden;
          border-radius: 6px;
          display: flex;
          justify-content: center;
          background: #000;
        }

        .preview-image-cropper img {
          max-width: 100%;
          max-height: 200px;
          object-fit: contain;
        }

        /* Loader Button styling */
        .btn-loader-parent {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .button-spinner {
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

        /* Animations */
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
          .recharge-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
