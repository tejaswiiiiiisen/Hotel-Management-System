import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaGlobe, FaChevronDown, FaCheck } from "react-icons/fa";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧", name: "English" },
  { code: "hi", label: "हिंदी", flag: "🇮🇳", name: "Hindi" },
  { code: "es", label: "Español", flag: "🇪🇸", name: "Spanish" },
  { code: "fr", label: "Français", flag: "🇫🇷", name: "French" },
];

export default function LanguageSwitcher({ compact = false }) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLangCode = i18n.language ? i18n.language.split("-")[0] : "en";
  const currentLang = LANGUAGES.find((l) => l.code === currentLangCode) || LANGUAGES[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-medium shadow-xs transition-all cursor-pointer"
        title={t("header.select_language", "Select Language")}
      >
        <span className="text-sm">{currentLang.flag}</span>
        {!compact && <span className="font-semibold">{currentLang.label}</span>}
        <FaChevronDown className={`text-[10px] text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {t("header.select_language", "Select Language")}
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = currentLangCode === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                {isSelected && <FaCheck className="text-emerald-500 text-xs" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
