import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AuthModal from "./AuthModal";
import { FiLogOut, FiUser } from "react-icons/fi";
import { UserIcon } from "./icons";
import { apiFetch } from "../../lib/api";
import type { User } from "../../types";

interface AccountControlProps {
  variant?: "dark" | "light";
  className?: string;
}

// Top-right account control. When signed out it links to /login.
// Once signed in, clicking opens a clean dropdown with My Account and Logout.
export default function AccountControl({
  variant = "light",
  className = "",
}: AccountControlProps) {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isDark = variant === "dark";

  useEffect(() => {
    let active = true;
    const isExplicitlyLoggedIn =
      sessionStorage.getItem("website_user_logged_in") === "true" ||
      localStorage.getItem("website_user_logged_in") === "true";

    if (!isExplicitlyLoggedIn) {
      setUser(null);
      return;
    }

    apiFetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && d.user) {
          // If backend returns super_admin/admin but website_user_logged_in was not set by website login, ignore admin session
          if ((d.user.role === "super_admin" || d.user.role === "admin") && !sessionStorage.getItem("website_user_logged_in") && !localStorage.getItem("website_user_logged_in")) {
            setUser(null);
          } else {
            setUser(d.user);
          }
        } else if (active) {
          setUser(null);
        }
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, []);

  // Close the menu on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function logout() {
    sessionStorage.removeItem("user_logged_in");
    sessionStorage.removeItem("website_user_logged_in");
    localStorage.removeItem("website_user_logged_in");
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    setOpen(false);
    window.location.href = "/";
  }

  // Signed out → login link.
  if (!user) {
    return (
      <>
      <button
        onClick={() => setShowAuthModal(true)}
        aria-label="Login"
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          isDark
            ? "text-white/85 hover:text-white hover:bg-white/10"
            : "text-navy/80 hover:text-navy hover:bg-black/5"
        } ${className}`}
      >
        <UserIcon className="h-5 w-5" />
      </button>
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={() => {
            setShowAuthModal(false);
            window.location.reload();
          }}
        />
      )}
      </>
    );
  }

  // Signed in → icon + first name, with simple dropdown (My Profile & Logout).
  const firstName = user.name.split(" ")[0];

  const avatarBorderClass = isDark
    ? "border-white/40 text-white"
    : "border-slate-300 text-navy";

  const textClass = isDark
    ? "text-white/90 group-hover:text-white"
    : "text-navy group-hover:text-brand";

  return (
    <div ref={boxRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`group flex items-center gap-2 rounded-full py-1 px-1.5 transition-colors cursor-pointer ${className}`}
      >
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white font-bold text-xs shadow-2xs`}
        >
          {user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <span className={`text-sm font-medium tracking-wide transition-colors ${textClass}`}>
          {firstName}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_12px_30px_rgba(0,0,0,0.18)] font-jost text-navy">
          <div className="border-b border-slate-100 px-3.5 py-2.5">
            <div className="truncate text-sm font-bold text-navy">
              {user.name}
            </div>
            <div className="truncate text-xs text-slate-500">{user.email}</div>
          </div>

          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FiUser className="h-4 w-4 text-brand" />
            My Account
          </Link>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3.5 py-2.5 text-left text-sm font-bold text-red-600 transition-colors hover:bg-rose-50 cursor-pointer"
          >
            <FiLogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
