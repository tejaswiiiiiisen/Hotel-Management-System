import React, { useState } from "react";
import { FiX, FiMail, FiLock, FiUser, FiPhone } from "react-icons/fi";
import { apiFetch } from "../../lib/api";
import { showSuccess, showError } from "../../utils/toast";
import { isValidEmail, isValidMobile } from "../../lib/validation";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) { showError("Please enter a valid email address."); return; }
    if (mode === "signup" && !isValidMobile(phone)) { showError("Please enter a valid mobile number (7–15 digits)."); return; }
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const payload = mode === "login" 
        ? { email, password } 
        : { name, email, phone, password, role: "Guest", orgId: "" };

      const res = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Authentication failed.");
      } else {
        sessionStorage.setItem("website_user_logged_in", "true");
        localStorage.setItem("website_user_logged_in", "true");
        sessionStorage.setItem("user_logged_in", "true");
        if (mode === "login") {
          showSuccess("Login successful. You can continue your booking.");
        } else {
          showSuccess("Account created successfully. You can continue your booking.");
        }
        onSuccess();
      }
    } catch (err: any) {
      showError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-xl font-bold text-navy dark:text-white">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            Please {mode === "login" ? "login" : "create an account"} to book a room.
          </p>

          <div className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-800 focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 transition-all dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                  />
                </div>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s()-]/g, ""))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-800 focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 transition-all dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-800 focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 transition-all dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
              />
            </div>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-800 focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 transition-all dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-brand py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-brand/30 transition-all hover:bg-brand/90 hover:shadow-brand/40 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-sm font-medium text-slate-600 hover:text-brand transition-colors dark:text-slate-400 dark:hover:text-brand"
          >
            {mode === "login" 
              ? "Don't have an account? Sign Up" 
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
