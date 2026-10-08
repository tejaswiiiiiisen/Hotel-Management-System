import { showSuccess, showError } from "../../utils/toast";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaPlane } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import PasswordInput from "./PasswordInput";
import { apiFetch } from "../../lib/api";
import { isValidEmail } from "../../lib/validation";

// Same coastal hero photo as the login page — keeps the two screens on-theme.
const BG_IMAGE =
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=2000&q=80";

type Message = { type: "success" | "error"; text: string } | null;

// "TRAVEL" wordmark with a little plane arcing over it (matches the login page).
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

export default function SignupForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password || !confirm) {
      showError("Please fill in all fields.");
      return;
    }
    if (!isValidEmail(email)) { showError("Please enter a valid email address."); return; }
    if (password !== confirm) {
      showError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || "Sign up failed.");
      } else {
        sessionStorage.setItem("website_user_logged_in", "true");
        localStorage.setItem("website_user_logged_in", "true");
        sessionStorage.setItem("user_logged_in", "true");
        showSuccess(`Welcome aboard, ${data.user.name.split(" ")[0]}!`);
        setTimeout(() => navigate("/"), 1000);
      }
    } catch {
      showError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-white/40 bg-white/95 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/40";
  const labelCls = "mb-2 block text-sm font-medium text-white/90";

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

      {/* Content: brand on the left, glass sign-up card on the right */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center gap-12 px-6 py-14 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-10">
        {/* Left — brand block */}
        <div className="w-full max-w-xl text-white lg:flex-1">
          <TravelLogo />

          <h1 className="mt-8 font-black uppercase leading-[0.92] tracking-tight text-[clamp(44px,7vw,88px)] drop-shadow-sm">
            Begin
            <br />
            Your Journey
          </h1>

          <p className="mt-6 max-w-md text-lg font-medium text-white/90">
            Create your account and unlock the world.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
            Join us to plan trips, save destinations, and make every corner of
            the world within your reach.
          </p>
        </div>

        {/* Right — glassmorphism sign-up card */}
        <div className="w-full max-w-md">
          <div className="rounded-[28px] border border-white/25 bg-white/10 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-8">
            <h2 className="mb-6 text-xl font-semibold text-white">
              Create an Account
            </h2>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="name" className={labelCls}>
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="email" className={labelCls}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="password" className={labelCls}>
                  Password
                </label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label htmlFor="confirm" className={labelCls}>
                  Confirm password
                </label>
                <PasswordInput
                  id="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#3b82f6] py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-lg shadow-[#3b82f6]/30 transition hover:bg-[#2f6bed] disabled:opacity-60"
              >
                {loading ? "Creating…" : "Create Account"}
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

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-white/30" />
                <span className="text-xs uppercase tracking-wide text-white/70">
                  or
                </span>
                <span className="h-px flex-1 bg-white/30" />
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={() =>
                  setMessage({
                    type: "error",
                    text: "Google sign-up isn't wired up in this demo.",
                  })
                }
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white/95 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-white"
              >
                <FcGoogle className="h-5 w-5" />
                Sign up with Google
              </button>

              <p className="pt-1 text-center text-[13px] text-white/80">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-white underline underline-offset-2 hover:opacity-90"
                >
                  Sign in
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
