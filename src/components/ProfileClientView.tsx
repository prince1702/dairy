"use client";

import React, { useState, useEffect } from "react";
import { updateCustomerProfile, changeCustomerPassword } from "@/app/customer-actions";
import { useRouter } from "next/navigation";

interface ProfileClientViewProps {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
}

export function ProfileClientView({ customer }: ProfileClientViewProps) {
  const router = useRouter();

  // Profile Form States
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [address, setAddress] = useState(customer.address);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState("");

  // Avatar Customization (Simulated using LocalStorage)
  const [avatarColor, setAvatarColor] = useState("#1A6B3C");
  const avatarColors = ["#1A6B3C", "#10B981", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444"];

  useEffect(() => {
    const savedColor = localStorage.getItem(`customer_avatar_${customer.id}`);
    if (savedColor) {
      setAvatarColor(savedColor);
    }
  }, [customer.id]);

  const handleSaveAvatarColor = (color: string) => {
    setAvatarColor(color);
    localStorage.setItem(`customer_avatar_${customer.id}`, color);
    // Refresh to propagate avatar changes in layout
    router.refresh();
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileError("Name cannot be empty.");
      return;
    }

    setProfileSubmitting(true);
    setProfileError("");
    setProfileSuccess(false);

    try {
      const res = await updateCustomerProfile(customer.id, {
        name,
        phone,
        address,
      });
      setProfileSubmitting(false);

      if (res.success) {
        setProfileSuccess(true);
        router.refresh();
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        setProfileError(res.error || "Failed to update profile.");
      }
    } catch (err: any) {
      setProfileSubmitting(false);
      setProfileError(err.message || "An unexpected error occurred.");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError("All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPassError("New password must be at least 8 characters long.");
      return;
    }

    setPassSubmitting(true);
    setPassError("");
    setPassSuccess(false);

    try {
      const res = await changeCustomerPassword(customer.id, currentPassword, newPassword);
      setPassSubmitting(false);

      if (res.success) {
        setPassSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPassSuccess(false), 3000);
      } else {
        setPassError(res.error || "Failed to change password.");
      }
    } catch (err: any) {
      setPassSubmitting(false);
      setPassError(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-grid">
        {/* Left Side: Avatar customization & Profile Form */}
        <div className="profile-form-panel card">
          <div className="avatar-settings-section">
            <div className="avatar-circle-large" style={{ backgroundColor: avatarColor }}>
              {name ? name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="avatar-controls">
              <h4>Choose Profile Theme Color</h4>
              <p className="text-muted">Personalize your customer portal appearance.</p>
              <div className="colors-grid">
                {avatarColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-dot-btn ${avatarColor === color ? "active" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleSaveAvatarColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="profile-divider"></div>

          <h3>Customer Details</h3>
          <p className="text-muted">Update your contact details and silent delivery address instructions.</p>

          {profileError && <div className="badge badge-danger mb-4 block-alert">{profileError}</div>}
          {profileSuccess && <div className="badge badge-success mb-4 block-alert">Profile updated successfully!</div>}

          <form onSubmit={handleProfileSubmit} className="mt-4">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={profileSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Read-only)</label>
              <input
                type="email"
                className="form-input readonly-input"
                value={customer.email}
                readOnly
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={profileSubmitting}
                placeholder="e.g. +91 99999 99999"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Delivery Address</label>
              <textarea
                className="form-input textarea-input"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={profileSubmitting}
                placeholder="House number, apartment name, street details..."
              />
              <span className="address-hint text-muted">Please provide complete directions for accurate morning deliveries.</span>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4" disabled={profileSubmitting}>
              {profileSubmitting ? "Saving Profile..." : "Save Profile Details"}
            </button>
          </form>
        </div>

        {/* Right Side: Change Password Form */}
        <div className="password-form-panel card">
          <h3>Change Password</h3>
          <p className="text-muted">Update your password regularly to keep your wallet account secure.</p>

          {passError && <div className="badge badge-danger mb-4 block-alert">{passError}</div>}
          {passSuccess && <div className="badge badge-success mb-4 block-alert">Password updated successfully!</div>}

          <form onSubmit={handlePasswordSubmit} className="mt-4">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={passSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={passSubmitting}
                required
              />
              <span className="field-hint text-muted">Must be at least 8 characters.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={passSubmitting}
                required
              />
            </div>

            <button type="submit" className="btn btn-outline w-full mt-6" disabled={passSubmitting}>
              {passSubmitting ? "Updating Password..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .profile-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 32px;
          align-items: flex-start;
        }

        /* Avatar styling */
        .avatar-settings-section {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 24px;
        }

        .avatar-circle-large {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          color: white;
          font-size: 28px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .avatar-controls h4 {
          font-size: 15px;
          color: var(--text-main);
        }

        .colors-grid {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .color-dot-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }

        .color-dot-btn.active {
          border-color: var(--text-main);
          transform: scale(1.1);
        }

        .profile-divider {
          border-top: 1px solid var(--border-color);
          margin-bottom: 24px;
        }

        .textarea-input {
          resize: vertical;
          font-family: inherit;
        }

        .readonly-input {
          background: var(--border-light);
          cursor: not-allowed;
          opacity: 0.85;
        }

        .address-hint, .field-hint {
          display: block;
          font-size: 11px;
          margin-top: 4px;
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
          .profile-grid {
            grid-template-columns: 1fr;
          }
          .avatar-settings-section {
            flex-direction: column;
            text-align: center;
          }
          .colors-grid {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
