import { useState, type ChangeEvent } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

// A password field with a show/hide eye toggle. Matches the glass auth styling
// used across the login / signup / reset pages.
interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
}

export default function PasswordInput({
  id,
  value,
  onChange,
  placeholder = "••••••••••••",
  autoComplete = "current-password",
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-white/40 bg-white/95 px-4 py-3 pr-11 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/40"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-700"
      >
        {/* Default (password hidden) → closed eye; when revealed → open eye. */}
        {show ? <FiEye className="h-5 w-5" /> : <FiEyeOff className="h-5 w-5" />}
      </button>
    </div>
  );
}
