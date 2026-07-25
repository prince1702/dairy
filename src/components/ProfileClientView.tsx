"use client";

import React, { useState, useEffect } from "react";
import { updateCustomerProfile, changeCustomerPassword } from "@/app/customer-actions";
import { useRouter } from "next/navigation";

interface AuditLog {
  id: string;
  actionType: string;
  details: string;
  timestamp: string;
}

interface ProfileClientViewProps {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  auditLogs?: AuditLog[];
}

export function ProfileClientView({
  customer,
  auditLogs = [],
}: ProfileClientViewProps) {
  const router = useRouter();

  // Profile fields state
  const [profileName, setProfileName] = useState(customer.name);
  const [profilePhone, setProfilePhone] = useState(customer.phone);
  const [profileAddress, setProfileAddress] = useState(customer.address);

  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Theme color picker local state
  const [selectedThemeColor, setSelectedThemeColor] = useState("green");

  // Simulated avatar photo upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Floating label focus states
  const [focusName, setFocusName] = useState(false);
  const [focusPhone, setFocusPhone] = useState(false);
  const [focusAddress, setFocusAddress] = useState(false);
  const [focusCurrPass, setFocusCurrPass] = useState(false);
  const [focusNewPass, setFocusNewPass] = useState(false);
  const [focusConfPass, setFocusConfPass] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("avatar_theme_color");
    if (savedTheme) {
      setSelectedThemeColor(savedTheme);
    }
    const savedPhoto = localStorage.getItem("avatar_profile_photo");
    if (savedPhoto) {
      setAvatarPreview(savedPhoto);
    }
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSubmitting(true);
    setProfileSuccess(false);
    setProfileError("");

    try {
      const res = await updateCustomerProfile(customer.id, {
        name: profileName,
        phone: profilePhone,
        address: profileAddress,
      });

      if (res.success) {
        setProfileSuccess(true);
        router.refresh();
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        setProfileError(res.error || "Failed to update profile details.");
      }
    } catch (err: any) {
      setProfileError(err.message || "An error occurred.");
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    setPasswordSubmitting(true);
    setPasswordSuccess(false);
    setPasswordError("");

    try {
      const res = await changeCustomerPassword(
        customer.id,
        currentPassword,
        newPassword
      );

      if (res.success) {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordError(res.error || "Failed to change password.");
      }
    } catch (err: any) {
      setPasswordError(err.message || "An error occurred.");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const selectColorTheme = (color: string) => {
    setSelectedThemeColor(color);
    localStorage.setItem("avatar_theme_color", color);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAvatarPreview(base64);
        localStorage.setItem("avatar_profile_photo", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearAvatarPhoto = () => {
    setAvatarPreview(null);
    localStorage.removeItem("avatar_profile_photo");
  };

  const getThemeHex = (colorName: string) => {
    if (colorName === "green") return "#1A6B3C";
    if (colorName === "blue") return "#2563EB";
    if (colorName === "purple") return "#7C3AED";
    if (colorName === "amber") return "#D97706";
    return "#1A6B3C";
  };

  // Convert details JSON string to readable description for audit logs
  const formatAuditDetails = (log: AuditLog) => {
    try {
      const data = JSON.parse(log.details);
      if (log.actionType === "OVERRIDE_QTY") {
        return `Changed override quantity of item ID "${data.productId?.slice(-6)}" to ${data.quantity}`;
      }
      if (log.actionType === "VACATION_START") {
        return `Scheduled vacation from ${new Date(data.startDate).toLocaleDateString()} to ${new Date(data.endDate).toLocaleDateString()}`;
      }
      if (log.actionType === "PAUSE") {
        return `Paused order for tomorrow: ${new Date(data.pauseDate).toLocaleDateString()}`;
      }
      return log.details;
    } catch (e) {
      return log.details;
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-grid">
        {/* Left Side: Photo Picker & Forms */}
        <div className="profile-details-column">
          
          {/* Avatar / Photo Selector Card */}
          <div className="profile-avatar-card card">
            <div className="avatar-picker-layout">
              <div className="avatar-preview-box" style={{ borderColor: getThemeHex(selectedThemeColor) }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="User Avatar Profile" />
                ) : (
                  <span className="avatar-initials" style={{ background: getThemeHex(selectedThemeColor) }}>
                    {profileName ? profileName.charAt(0).toUpperCase() : "U"}
                  </span>
                )}
              </div>

              <div className="avatar-controls">
                <strong>Profile Avatar</strong>
                <p className="text-muted">Choose a theme color or upload a custom profile picture.</p>
                
                <div className="color-dots-row mt-2">
                  <button className={`color-dot green ${selectedThemeColor === "green" ? "active" : ""}`} onClick={() => selectColorTheme("green")} type="button" aria-label="Green theme"></button>
                  <button className={`color-dot blue ${selectedThemeColor === "blue" ? "active" : ""}`} onClick={() => selectColorTheme("blue")} type="button" aria-label="Blue theme"></button>
                  <button className={`color-dot purple ${selectedThemeColor === "purple" ? "active" : ""}`} onClick={() => selectColorTheme("purple")} type="button" aria-label="Purple theme"></button>
                  <button className={`color-dot amber ${selectedThemeColor === "amber" ? "active" : ""}`} onClick={() => selectColorTheme("amber")} type="button" aria-label="Amber theme"></button>
                </div>

                <div className="avatar-actions-buttons mt-3">
                  <button className="btn btn-outline btn-sm" onClick={() => document.getElementById("avatar-file-input")?.click()} type="button">
                    Upload Picture 📸
                  </button>
                  {avatarPreview && (
                    <button className="btn btn-ghost btn-sm text-danger-btn ml-2" onClick={clearAvatarPhoto} type="button">
                      Remove
                    </button>
                  )}
                  <input id="avatar-file-input" type="file" accept="image/*" className="hidden-file-input" onChange={handleAvatarFileChange} />
                </div>
              </div>
            </div>
          </div>

          {/* Details Forms Card */}
          <div className="profile-edit-card card mt-6">
            <h3>Update Profile Details</h3>
            <p className="text-muted">Edit your contact details and default delivery address.</p>

            {profileError && <div className="badge badge-danger mb-4 block-alert">{profileError}</div>}
            {profileSuccess && <div className="badge badge-success mb-4 block-alert">Profile updated successfully!</div>}

            <form onSubmit={handleProfileSubmit} className="mt-6">
              {/* Floating label: Name */}
              <div className={`floating-form-group ${focusName || profileName ? "focused" : ""}`}>
                <label className="floating-label" htmlFor="profile-name">Full Name</label>
                <input
                  id="profile-name"
                  type="text"
                  className="form-input floating-input"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  onFocus={() => setFocusName(true)}
                  onBlur={() => setFocusName(false)}
                  disabled={profileSubmitting}
                  required
                />
              </div>

              {/* Floating label: Phone */}
              <div className={`floating-form-group mt-4 ${focusPhone || profilePhone ? "focused" : ""}`}>
                <label className="floating-label" htmlFor="profile-phone">Phone Number</label>
                <input
                  id="profile-phone"
                  type="text"
                  className="form-input floating-input"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  onFocus={() => setFocusPhone(true)}
                  onBlur={() => setFocusPhone(false)}
                  disabled={profileSubmitting}
                />
              </div>

              {/* Floating label: Address */}
              <div className={`floating-form-group mt-4 ${focusAddress || profileAddress ? "focused" : ""}`}>
                <label className="floating-label" htmlFor="profile-address">Delivery Address</label>
                <textarea
                  id="profile-address"
                  className="form-input floating-input textarea-field"
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  onFocus={() => setFocusAddress(true)}
                  onBlur={() => setFocusAddress(false)}
                  disabled={profileSubmitting}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary w-full mt-6" disabled={profileSubmitting}>
                {profileSubmitting ? "Saving..." : "Save Details"}
              </button>
            </form>
          </div>

          {/* Password Reset Card */}
          <div className="profile-password-card card mt-6">
            <h3>Change Password</h3>
            <p className="text-muted">Ensure your account uses a secure password phrase.</p>

            {passwordError && <div className="badge badge-danger mb-4 block-alert">{passwordError}</div>}
            {passwordSuccess && <div className="badge badge-success mb-4 block-alert">Password updated successfully!</div>}

            <form onSubmit={handlePasswordSubmit} className="mt-6">
              {/* Floating current password */}
              <div className={`floating-form-group ${focusCurrPass || currentPassword ? "focused" : ""}`}>
                <label className="floating-label" htmlFor="curr-pass">Current Password</label>
                <input
                  id="curr-pass"
                  type="password"
                  className="form-input floating-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  onFocus={() => setFocusCurrPass(true)}
                  onBlur={() => setFocusCurrPass(false)}
                  disabled={passwordSubmitting}
                  required
                />
              </div>

              {/* Floating new password */}
              <div className={`floating-form-group mt-4 ${focusNewPass || newPassword ? "focused" : ""}`}>
                <label className="floating-label" htmlFor="new-pass">New Password (Min 8 chars)</label>
                <input
                  id="new-pass"
                  type="password"
                  className="form-input floating-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={() => setFocusNewPass(true)}
                  onBlur={() => setFocusNewPass(false)}
                  disabled={passwordSubmitting}
                  required
                />
              </div>

              {/* Floating confirm password */}
              <div className={`floating-form-group mt-4 ${focusConfPass || confirmPassword ? "focused" : ""}`}>
                <label className="floating-label" htmlFor="conf-pass">Confirm New Password</label>
                <input
                  id="conf-pass"
                  type="password"
                  className="form-input floating-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusConfPass(true)}
                  onBlur={() => setFocusConfPass(false)}
                  disabled={passwordSubmitting}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary w-full mt-6" disabled={passwordSubmitting}>
                {passwordSubmitting ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Recent Activity Timeline */}
        <div className="profile-activity-column">
          <div className="card sticky-activity-card">
            <h3>Recent Account Activity</h3>
            <p className="text-muted">A clear audit log of your schedule modifications, overrides, and vacation pauses.</p>

            <div className="activity-timeline-feed mt-6">
              {auditLogs.length === 0 ? (
                <p className="empty-activity text-muted text-center py-8">
                  📭 No recent activity logs found.
                </p>
              ) : (
                <div className="activity-timeline">
                  {auditLogs.map((log, idx) => {
                    const time = new Date(log.timestamp);
                    return (
                      <div key={log.id} className="activity-node">
                        <div className="activity-indicator">
                          <span className="activity-dot-circle"></span>
                          {idx < auditLogs.length - 1 && <span className="activity-connector-bar"></span>}
                        </div>
                        <div className="activity-content-box">
                          <div className="activity-header-meta">
                            <strong className="activity-type-label">{log.actionType}</strong>
                            <span className="activity-time-stamp text-muted">
                              {time.toLocaleDateString()} at {time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <p className="activity-description-text text-muted">
                            {formatAuditDetails(log)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
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
          grid-template-columns: 1.2fr 1fr;
          gap: 32px;
          align-items: flex-start;
        }

        /* Avatar Selector styling */
        .avatar-picker-layout {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .avatar-preview-box {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 4px solid var(--primary-color);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--border-light);
          flex-shrink: 0;
        }

        .avatar-preview-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-initials {
          width: 100%;
          height: 100%;
          color: white;
          font-size: 28px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-controls {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .avatar-controls strong {
          font-size: 15px;
          color: var(--text-main);
        }

        .avatar-controls p {
          font-size: 12px;
        }

        .color-dots-row {
          display: flex;
          gap: 8px;
        }

        .color-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }

        .color-dot:hover {
          transform: scale(1.1);
        }

        .color-dot.active {
          border-color: var(--text-main);
          box-shadow: 0 0 0 2px white;
        }

        .color-dot.green { background: #1A6B3C; }
        .color-dot.blue { background: #2563EB; }
        .color-dot.purple { background: #7C3AED; }
        .color-dot.amber { background: #D97706; }

        .avatar-actions-buttons {
          display: flex;
          align-items: center;
        }

        .ml-2 {
          margin-left: 8px;
        }

        .hidden-file-input {
          display: none;
        }

        .text-danger-btn {
          color: var(--danger-color);
        }

        .text-danger-btn:hover {
          background: var(--danger-light);
        }

        /* Floating label forms styling */
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
          min-height: 80px;
          resize: vertical;
        }

        .floating-form-group.focused .floating-label,
        .floating-form-group .floating-input:not([value=""]) + .floating-label {
          transform: translateY(-8px) scale(0.85);
          transform-origin: top left;
          color: var(--primary-color);
        }

        /* Activity timeline styling */
        .sticky-activity-card {
          position: sticky;
          top: 94px;
        }

        .activity-timeline {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-left: 8px;
        }

        .activity-node {
          display: flex;
          gap: 16px;
        }

        .activity-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .activity-dot-circle {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--primary-color);
          z-index: 2;
          margin-top: 6px;
        }

        .activity-connector-bar {
          position: absolute;
          top: 16px;
          bottom: -20px;
          width: 2px;
          background: var(--border-color);
          z-index: 1;
        }

        .activity-content-box {
          flex: 1;
          background: var(--border-light);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .activity-header-meta {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .activity-type-label {
          color: var(--text-main);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .activity-time-stamp {
          font-size: 10px;
        }

        .activity-description-text {
          font-size: 12px;
          line-height: 1.4;
        }

        .empty-activity {
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
          .profile-grid {
            grid-template-columns: 1fr;
          }
          .sticky-activity-card {
            position: static;
            margin-top: 24px;
          }
        }
      `}</style>
    </div>
  );
}
