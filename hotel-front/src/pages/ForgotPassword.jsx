import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../auth.js";
import { showError, showSuccess } from "../utils/toast.js";
import { FaArrowLeft, FaEnvelope, FaPaperPlane, FaCheckCircle } from "react-icons/fa";
import hotelResortImg from "../assets/hotel_resort_view.jpg";
import hotelGuestsImg from "../assets/hotel_guests_view.jpg";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetLinkInfo, setResetLinkInfo] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) {
      showError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    showError("");
    try {
      const result = await requestPasswordReset(email);
      if (result.success) {
        setSubmitted(true);
        setResetLinkInfo(result.devResetLink || null);
        showSuccess(result.message || "Reset link sent!");
      } else {
        showError(result.message || "Failed to request password reset.");
      }
    } catch (err) {
      showError("An error occurred while requesting password reset.");
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
            <h2>Account Security & Recovery</h2>
            <p>
              Verify your identity and recover your Tourm account access securely with step-by-step email authentication.
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
            <h1>Forgot Password?</h1>
            <p>
              Enter your registered email address below. We will send a secure link to reset your password.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="traveling-form" noValidate>
              <div className="traveling-field">
                <label htmlFor="reset-email">Email Address</label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your registered email (e.g. adminhotel@hotel.com)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button type="submit" className="traveling-submit-btn cyan-btn" disabled={loading}>
                {loading ? "SENDING LINK..." : "SEND RESET LINK"}
              </button>
            </form>
          ) : (
            <div className="reset-submitted-card" style={{
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
              borderRadius: "16px",
              padding: "20px",
              textAlign: "center",
              marginTop: "12px"
            }}>
              <FaCheckCircle style={{ fontSize: "36px", color: "#0284c7", marginBottom: "12px" }} />
              <h3 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "8px", fontWeight: "800" }}>
                Reset Link Dispatched!
              </h3>
              <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5", marginBottom: "16px" }}>
                If an account exists for <strong>{email}</strong>, a password reset link has been issued.
              </p>

              {resetLinkInfo && (
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px stroke #e0f2fe" }}>
                  <p style={{ fontSize: "12px", color: "#0369a1", marginBottom: "8px", fontWeight: "700" }}>
                    🔗 Click below to open the Reset Password page:
                  </p>
                  <button
                    onClick={() => navigate(resetLinkInfo)}
                    className="traveling-submit-btn cyan-btn"
                    style={{ padding: "12px", fontSize: "14px" }}
                  >
                    Open Password Reset Link →
                  </button>
                </div>
              )}
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
