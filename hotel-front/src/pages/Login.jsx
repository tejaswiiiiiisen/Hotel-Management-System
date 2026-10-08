import { showError, showSuccess } from "../utils/toast.js";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, getUserRole, clearCurrentOrg } from "../auth.js";
import { ROLES } from "../rbac.js";
import { logAction } from "../audit.js";
import { FaLock, FaEnvelope, FaUserShield, FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import hotelResortImg from "../assets/hotel_resort_view.jpg";
import hotelGuestsImg from "../assets/hotel_guests_view.jpg";

const demoAccounts = [
  { email: "adminhotel@hotel.com", password: "admin123", role: "super_admin" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function doLogin(mail, pass) {
    showError("");
    setLoading(true);
    try {
      const result = await login(mail, pass);
      if (result.success) {
        logAction("Logged in", "to Admin Dashboard", "login");
        const userRole = getUserRole();
        const isAdmin = userRole === "super_admin" || mail.trim().toLowerCase() === "adminhotel@hotel.com" || mail.trim().toLowerCase() === "admin@gmail.com";
        if (isAdmin) {
          clearCurrentOrg();
          navigate("/organizations");
        } else {
          navigate("/dashboard");
        }
      } else {
        showError(result.message || "Invalid email or password.");
      }
    } catch (err) {
      showError("An unexpected login error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      showError("Please fill in all fields.");
      return;
    }
    doLogin(email, password);
  }

  return (
    <div className="traveling-auth-wrapper">
      {/* Floating Back to Website Button */}
      <button 
        className="back-to-website-btn-v3" 
        onClick={() => navigate("/")}
        title="Back to Main Website"
      >
        <FaArrowLeft style={{ marginRight: "8px" }} /> Back to Website
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
                <circle cx="48" cy="8" r="3" fill="#38bdf8" />
                <circle cx="54" cy="4" r="2" fill="#0284c7" />
              </svg>
            </div>

            {/* Decorative Globe Doodle */}
            <div className="hero-doodle-globe">
              <svg width="42" height="42" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="18" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2.5" />
                <path d="M10 24H38M24 10C28 15 30 20 30 24C30 28 28 33 24 38C20 33 18 28 18 24C18 20 20 15 24 10Z" stroke="#0284c7" strokeWidth="2" />
                <path d="M30 14L40 8M40 8L36 18M40 8L28 12" stroke="#00b4d8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Caption & Carousel Dots */}
          <div className="traveling-hero-caption">
            <h2>Secure Your Next Stay</h2>
            <p>
              Discover luxury hospitality, seamless room bookings, and smart property management for an unforgettable guest experience.
            </p>
            <div className="traveling-pagination-dots">
              <span className="dot inactive"></span>
              <span className="dot active"></span>
              <span className="dot inactive"></span>
            </div>
          </div>
        </div>

        {/* RIGHT LOGIN FORM SECTION */}
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
            <h1>
              Welcome to <span className="highlight-text tourm-title">Tourm</span>
            </h1>
            <p>
              Login to access exclusive hotel operations, manage room bookings, and plan guest stays hassle-free!
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="traveling-form" noValidate>
            <div className="traveling-field">
              <label htmlFor="email">Email / Phone</label>
              <input
                id="email"
                type="text"
                placeholder="Email or Phone Number (e.g. adminhotel@hotel.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="traveling-field">
              <label htmlFor="password">Password</label>
              <div className="password-input-row">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <div className="forgot-pass-container">
                <a href="/forgot-password" onClick={(e) => { e.preventDefault(); navigate("/forgot-password"); }} className="traveling-forgot-link">
                  Forgot Password?
                </a>
              </div>
            </div>

            <button type="submit" className="traveling-submit-btn cyan-btn" disabled={loading}>
              {loading ? "LOGGING IN..." : "LOG IN"}
            </button>
          </form>

          {/* DEMO QUICK ACCESS */}
          <div className="traveling-quick-demo">
            <span className="demo-label">Quick Demo Access:</span>
            {demoAccounts.map((a) => (
              <button
                key={a.email}
                type="button"
                className="demo-account-pill"
                disabled={loading}
                onClick={() => {
                  setEmail(a.email);
                  setPassword(a.password);
                  doLogin(a.email, a.password);
                }}
              >
                <span className="demo-badge cyan-badge">Super Admin</span>
                <span className="demo-cred">{a.email} · {a.password}</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="traveling-divider">
            <span>or continue with</span>
          </div>

          {/* Social / Alternative Login Buttons */}
          <div className="traveling-social-row">
            <button type="button" className="social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Google</span>
            </button>
            <button type="button" className="social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Facebook</span>
            </button>
            <button type="button" className="social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.96.99-3.12-1 .04-2.25.67-2.95 1.49-.62.72-1.16 1.88-1.01 3.01 1.12.09 2.3-.56 2.97-1.38z"/>
              </svg>
              <span>Apple</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
