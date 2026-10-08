import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordWithToken } from "../auth.js";
import { showError, showSuccess } from "../utils/toast.js";
import { FaArrowLeft, FaLock, FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import hotelResortImg from "../assets/hotel_resort_view.jpg";
import hotelGuestsImg from "../assets/hotel_guests_view.jpg";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successDone, setSuccessDone] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!token || !email) {
      showError("Invalid or missing password reset link token.");
      return;
    }

    if (!password || !confirmPassword) {
      showError("Please enter and confirm your new password.");
      return;
    }

    if (password.length < 6) {
      showError("New password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setLoading(true);
    showError("");
    try {
      const result = await resetPasswordWithToken(token, email, password);
      if (result.success) {
        setSuccessDone(true);
        showSuccess(result.message || "Password reset successful! You can now log in.");
      } else {
        showError(result.message || "Failed to reset password. Link may be expired.");
      }
    } catch (err) {
      showError("An error occurred while updating your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="traveling-auth-wrapper">
      {/* Floating Back to Login Button */}
      <button 
        className="back-to-website-btn-v3" 
        onClick={() => navigate("/login")}
        title="Back to Login Page"
      >
        <FaArrowLeft style={{ marginRight: "8px" }} /> Back to Login
      </button>

      <div className="traveling-login-card">
        {/* LEFT VISUAL HERO SECTION */}
        <div className="traveling-hero-side">
          <div className="hero-overlapping-container">
            {/* Top Back Image */}
            <div className="hero-card-back">
              <img src={hotelResortImg} alt="Luxury Resort View" />
            </div>

            {/* Bottom Front Overlapping Image */}
            <div className="hero-card-front">
              <img src={hotelGuestsImg} alt="Happy Resort Guests" />
            </div>

            {/* Decorative Observer Vector Doodle */}
            <div className="hero-doodle-observer">
              <svg width="55" height="55" viewBox="0 0 64 64" fill="none">
                <circle cx="20" cy="12" r="8" fill="#38bdf8" />
                <path d="M12 36C12 28 18 24 24 24H28L36 28V48H28V60H20V48H12V36Z" fill="#0284c7" />
                <path d="M32 20L58 14M32 20L58 26" stroke="#00b4d8" strokeWidth="3" strokeLinecap="round" />
                <circle cx="58" cy="20" r="4" fill="#0369a1" />
              </svg>
            </div>
          </div>

          {/* Caption */}
          <div className="traveling-hero-caption">
            <h2>Create New Password</h2>
            <p>
              Your new password will be encrypted and updated directly in the Tourm database.
            </p>
          </div>
        </div>

        {/* RIGHT FORM SECTION */}
        <div className="traveling-form-side">
          {/* Brand Header */}
          <div className="traveling-brand-header">
            <div className="brand-logo-icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <rect x="2.5" y="7" width="19" height="13" rx="3.5" stroke="#00b4d8" strokeWidth="2.2" fill="none" />
                <path d="M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7" stroke="#00b4d8" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="12" cy="13.5" r="2.5" fill="#00b4d8" />
                <line x1="1" y1="13.5" x2="23" y2="13.5" stroke="#00b4d8" strokeWidth="1.8" />
              </svg>
            </div>
            <span className="brand-logo-name tourm-title">Tourm</span>
          </div>

          {/* Welcome Heading */}
          <div className="traveling-welcome-box">
            <h1>Reset Password</h1>
            <p>
              Set a strong new password for account: <strong>{email || "User Account"}</strong>
            </p>
          </div>

          {!successDone ? (
            <form onSubmit={handleSubmit} className="traveling-form" noValidate>
              <div className="traveling-field">
                <label htmlFor="new-password">New Password</label>
                <div className="password-input-row">
                  <input
                    id="new-password"
                    type={showPass ? "text" : "password"}
                    placeholder="Enter new password (min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="traveling-field">
                <label htmlFor="confirm-password">Confirm New Password</label>
                <input
                  id="confirm-password"
                  type={showPass ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="traveling-submit-btn cyan-btn" disabled={loading}>
                {loading ? "SAVING NEW PASSWORD..." : "UPDATE PASSWORD"}
              </button>
            </form>
          ) : (
            <div className="reset-submitted-card" style={{
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
              borderRadius: "16px",
              padding: "24px",
              textAlign: "center",
              marginTop: "12px"
            }}>
              <FaCheckCircle style={{ fontSize: "42px", color: "#0284c7", marginBottom: "12px" }} />
              <h3 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "8px", fontWeight: "800" }}>
                Password Updated Successfully!
              </h3>
              <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: "1.5", marginBottom: "20px" }}>
                Your new password has been saved in the database. You can now sign in with your updated credentials.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="traveling-submit-btn cyan-btn"
              >
                Go to Sign In →
              </button>
            </div>
          )}

          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <a 
              href="#login" 
              onClick={(e) => { e.preventDefault(); navigate("/login"); }}
              className="traveling-forgot-link"
              style={{ fontSize: "14px" }}
            >
              ← Back to Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
