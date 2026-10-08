
import { useState } from "react";
import { Link } from "react-router-dom";
import { FaPlane } from "react-icons/fa";
import { apiFetch } from "../../lib/api";
import { isValidEmail } from "../../lib/validation";

// Same coastal hero photo as the login/signup pages — keeps the auth screens
// on-theme. Swap for a local asset any time (e.g. "/images/login-bg.jpg").
const BG_IMAGE =
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=2000&q=80";

// "TRAVEL" wordmark with a little plane arcing over it (matches login/signup).
function TravelLogo() {
  return (
    <div className="relative inline-block">
      <svg
        className="absolute -top-3 left-6 h-6 w-24 text-white"
        viewBox="0 0 120 30"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 26 C 30 4, 78 4, 104 16"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeDasharray="3 4"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
      <span className="relative text-3xl font-semibold uppercase tracking-[0.25em] text-white">
        Tra
        <FaPlane className="mx-0.5 inline-block h-5 w-5 -rotate-[18deg] align-middle" />
        el
      </span>
    </div>
  );
}

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }
  const [devLink, setDevLink] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) {
      setMessage({ type: "error", text: "Please enter your email." });
      return;
    }
    if (!isValidEmail(email)) {
      setMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }
    setLoading(true);
    setMessage(null);
    setDevLink(null);
    try {
      const res = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Request failed." });
      } else {
        setMessage({ type: "success", text: data.message });
        // Dev convenience: no SMTP wired up, so the API hands back the reset
        // link directly for testing.
        if (data.devResetLink) setDevLink(data.devResetLink);
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden font-sans">
      {/* Full-bleed coastal background */}
      <img
        src={BG_IMAGE}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-700/25 to-indigo-900/40" />
      <div className="absolute inset-0 bg-black/15" />

      {/* Content: brand on the left, glass reset card on the right */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center gap-12 px-6 py-14 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-10">
        {/* Left — brand block */}
        <div className="w-full max-w-xl text-white lg:flex-1">
          <TravelLogo />

          <h1 className="mt-8 font-black uppercase leading-[0.92] tracking-tight text-[clamp(44px,7vw,88px)] drop-shadow-sm">
            Forgot
            <br />
            Password?
          </h1>

          <p className="mt-6 max-w-md text-lg font-medium text-white/90">
            It happens to the best of us.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
            Enter the email linked to your account and we&apos;ll send you a link
            to reset your password.
          </p>
        </div>

        {/* Right — glassmorphism reset card */}
        <div className="w-full max-w-md">
          <div className="rounded-[28px] border border-white/25 bg-white/10 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-8">
            <h2 className="mb-2 text-xl font-semibold text-white">
              Reset your password
            </h2>
            <p className="mb-6 text-sm text-white/70">
              We&apos;ll email you a secure reset link.
            </p>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-white/90"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/40 bg-white/95 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/40"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#3b82f6] py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-lg shadow-[#3b82f6]/30 transition hover:bg-[#2f6bed] disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>

              {message && (
                <div
                  className={`rounded-lg px-4 py-2.5 text-center text-[13px] ${
                    message.type === "success"
                      ? "bg-emerald-50/95 text-emerald-700"
                      : "bg-red-50/95 text-red-600"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {devLink && (
                <div className="rounded-lg bg-white/90 px-4 py-2.5 text-center text-[12px] text-slate-700">
                  <span className="mb-1 block font-semibold">
                    Dev only — no email configured:
                  </span>
                  <Link
                    to={devLink}
                    className="break-all font-medium text-[#2f6bed] underline"
                  >
                    Open reset link
                  </Link>
                </div>
              )}

              <p className="pt-1 text-center text-[13px] text-white/80">
                Remember your password?{" "}
                <Link
                  to="/login"
                  className="font-medium text-white underline underline-offset-2 hover:opacity-90"
                >
                  Back to Sign in
                </Link>
              </p>
            </form>
          </div>

          <div className="mt-5 text-center">
            <Link
              to="/"
              className="text-[13px] text-white/70 underline-offset-4 hover:text-white hover:underline"
            >
              ← Back to website
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
