import { showSuccess, showError } from "../../utils/toast";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaPlane } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import PasswordInput from "./PasswordInput";
import { apiFetch } from "../../lib/api";

// Coastal hero photo. Swap for a local asset any time — e.g. drop a file at
// /public/images/login-bg.jpg and change this to "/images/login-bg.jpg".
const BG_IMAGE =
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=2000&q=80";

type Message = { type: "success" | "error"; text: string } | null;

// "TRAVEL" wordmark with a little plane arcing over it, like the reference.
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

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  const from = (location.state as any)?.from?.pathname || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      showError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || "Sign in failed.");
      } else {
        sessionStorage.setItem("website_user_logged_in", "true");
        localStorage.setItem("website_user_logged_in", "true");
        sessionStorage.setItem("user_logged_in", "true");
        showSuccess(`Welcome back, ${data.user.name.split(" ")[0]}!`);
        setTimeout(() => navigate(from, { replace: true }), 800);
      }
    } catch {
      showError("Network error. Please try again.");
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
      {/* Dusk tint + legibility overlays (also a graceful fallback if the photo
          is slow/unavailable — the page still reads as a moody coastline). */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-700/25 to-indigo-900/40" />
      <div className="absolute inset-0 bg-black/15" />

      {/* Content: brand on the left, glass login card on the right */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center gap-12 px-6 py-14 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-10">
        {/* Left — brand block */}
        <div className="w-full max-w-xl text-white lg:flex-1">
          <TravelLogo />

          <h1 className="mt-8 font-black uppercase leading-[0.92] tracking-tight text-[clamp(44px,7vw,88px)] drop-shadow-sm">
            Explore
            <br />
            Horizons
          </h1>

          <p className="mt-6 max-w-md text-lg font-medium text-white/90">
            Where Your Dream Destinations Become Reality.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
            Embark on a journey where every corner of the world is within your
            reach.
          </p>
        </div>

        {/* Right — glassmorphism auth card */}
        <div className="w-full max-w-md">
          <div className="rounded-[28px] border border-white/25 bg-white/10 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-8">
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

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-white/90"
                >
                  Password
                </label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="mt-2 text-right">
                  <Link
                    to="/forgot-password"
                    className="text-[13px] text-white/80 underline underline-offset-2 hover:text-white"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#3b82f6] py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-lg shadow-[#3b82f6]/30 transition hover:bg-[#2f6bed] disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign In"}
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
                    text: "Google sign-in isn't wired up in this demo.",
                  })
                }
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white/95 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-white"
              >
                <FcGoogle className="h-5 w-5" />
                Sign in with Google
              </button>

              <p className="pt-1 text-center text-[13px] text-white/80">
                Are you new?{" "}
                <Link
                  to="/signup"
                  className="font-medium text-white underline underline-offset-2 hover:opacity-90"
                >
                  Create an Account
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
