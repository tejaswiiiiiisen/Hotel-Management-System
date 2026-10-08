import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaPlane } from "react-icons/fa";
import PasswordInput from "./PasswordInput";
import { apiFetch } from "../../lib/api";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=2000&q=80";

type Message = { type: "success" | "error"; text: string } | null;

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

export default function ResetPasswordForm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const email = params.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || !confirm) {
      setMessage({ type: "error", text: "Please fill in both fields." });
      return;
    }
    if (password !== confirm) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Reset failed." });
      } else {
        // Password is updated in the DB — show the success message, then send
        // the user to the login page after 2s to sign in with the new password.
        setMessage({ type: "success", text: data.message });
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  const labelCls = "mb-2 block text-sm font-medium text-white/90";

  return (
    <main className="relative min-h-screen w-full overflow-hidden font-sans">
      <img
        src={BG_IMAGE}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-700/25 to-indigo-900/40" />
      <div className="absolute inset-0 bg-black/15" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center gap-12 px-6 py-14 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-10">
        <div className="w-full max-w-xl text-white lg:flex-1">
          <TravelLogo />
          <h1 className="mt-8 font-black uppercase leading-[0.92] tracking-tight text-[clamp(44px,7vw,88px)] drop-shadow-sm">
            Set a New
            <br />
            Password
          </h1>
          <p className="mt-6 max-w-md text-lg font-medium text-white/90">
            Almost there.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
            Choose a new password for your account and you&apos;re back on the
            journey.
          </p>
        </div>

        <div className="w-full max-w-md">
          <div className="rounded-[28px] border border-white/25 bg-white/10 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-8">
            <h2 className="mb-6 text-xl font-semibold text-white">
              Reset password
            </h2>

            {!token || !email ? (
              <p className="text-sm text-white/80">
                This reset link is missing information. Please request a new one
                from the{" "}
                <Link to="/forgot-password" className="underline">
                  forgot password
                </Link>{" "}
                page.
              </p>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="password" className={labelCls}>
                    New password
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
                    Confirm new password
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
                  {loading ? "Updating…" : "Update Password"}
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

                <p className="pt-1 text-center text-[13px] text-white/80">
                  <Link
                    to="/login"
                    className="font-medium text-white underline underline-offset-2 hover:opacity-90"
                  >
                    Back to Sign in
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
