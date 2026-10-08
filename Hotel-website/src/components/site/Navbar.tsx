import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import AccountControl from "./AccountControl";
import { FiMenu, FiX, FiPhone, FiCalendar, FiChevronRight } from "react-icons/fi";
import { FaCrown } from "react-icons/fa";

interface NavbarProps {
  variant?: "dark" | "light" | "transparent";
}

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Rooms & Suites", href: "/rooms" },
  { label: "Services", href: "/services" },
  { label: "Experiences", href: "/experiences" },
  { label: "Offers", href: "/offers" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

export default function Navbar({ variant = "transparent" }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Glassmorphism classes based on scroll state and variant
  const isLightPage = variant === "light" || (scrolled && variant !== "dark");
  
  const headerBgClass = scrolled
    ? isLightPage
      ? "bg-white/95 backdrop-blur-md text-slate-900 shadow-lg border-b border-slate-100"
      : "bg-slate-950/85 backdrop-blur-md text-white shadow-2xl border-b border-white/10"
    : variant === "light"
    ? "bg-cream text-navy"
    : "bg-transparent text-white";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBgClass} ${
        scrolled ? "py-3.5" : "py-5"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* LEFT: LUXURY BRAND LOGO */}
          <Link to="/" className="group flex items-center gap-2 sm:gap-2.5 text-left transition-opacity hover:opacity-90 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md transition-transform duration-300 group-hover:scale-105 shrink-0">
              <FaCrown className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <span className="block font-display text-lg sm:text-xl font-bold tracking-wider uppercase leading-none truncate">
                Tejas
              </span>
              <span className="block text-[7.5px] sm:text-[9.5px] font-semibold tracking-[0.2em] sm:tracking-[0.25em] uppercase opacity-75 truncate">
                Luxury Hotel & Suites
              </span>
            </div>
          </Link>

          {/* CENTER: DESKTOP NAVIGATION LINKS */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`relative px-4 py-2 text-[14.5px] font-medium tracking-wide transition-all duration-200 rounded-lg ${
                    active
                      ? isLightPage
                        ? "text-amber-600 font-bold bg-amber-500/10"
                        : "text-amber-300 font-bold bg-white/10"
                      : isLightPage
                      ? "text-slate-700 hover:text-amber-600 hover:bg-slate-100/60"
                      : "text-white/85 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-amber-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: CONTACT, ACCOUNT CONTROL & BOOK NOW BUTTON */}
          <div className="hidden items-center gap-4 md:flex">
            {/* Direct Phone Call Button */}
            <a
              href="tel:+919876543210"
              className={`hidden xl:flex items-center gap-2 text-xs font-semibold tracking-wider transition-colors ${
                isLightPage ? "text-slate-600 hover:text-amber-600" : "text-white/80 hover:text-white"
              }`}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
                <FiPhone className="h-3.5 w-3.5" />
              </div>
              <span>+91 98765 43210</span>
            </a>

            {/* Account Profile / Login */}
            <div className="pl-1">
              <AccountControl
                className={`flex items-center gap-2 transition-colors ${
                  isLightPage ? "text-slate-800 hover:text-amber-600" : "text-white/90 hover:text-white"
                }`}
              />
            </div>

            {/* Prominent Book Now CTA Pill */}
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all duration-300 hover:from-amber-600 hover:to-amber-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <FiCalendar className="h-4 w-4" />
              <span>Book Now</span>
            </Link>
          </div>

          {/* MOBILE MENU TOGGLE BUTTON */}
          <div className="flex items-center gap-3 lg:hidden">
            <Link
              to="/booking"
              className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold uppercase text-white shadow-sm sm:hidden"
            >
              Book
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className={`p-2 rounded-xl border transition-colors ${
                isLightPage
                  ? "border-slate-200 text-slate-800 hover:bg-slate-100"
                  : "border-white/20 text-white hover:bg-white/10"
              }`}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE NAVIGATION SLIDE-DOWN DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[68px] bottom-0 z-40 bg-slate-950/95 backdrop-blur-xl text-white transition-all animate-fadeIn lg:hidden flex flex-col justify-between p-6">
          <div className="space-y-2 overflow-y-auto pt-2">
            <span className="block px-4 text-xs font-bold uppercase tracking-widest text-amber-400/80 mb-3">
              Navigation Menu
            </span>
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3.5 text-base font-semibold rounded-xl transition-all ${
                    active
                      ? "bg-amber-500/20 text-amber-400 border-l-4 border-amber-500"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{link.label}</span>
                  <FiChevronRight className="h-4 w-4 opacity-60" />
                </Link>
              );
            })}
          </div>

          <div className="border-t border-white/10 pt-6 space-y-4">
            <div className="flex items-center justify-between px-2">
              <a href="tel:+919876543210" className="flex items-center gap-2 text-sm text-slate-300">
                <FiPhone className="h-4 w-4 text-amber-400" />
                <span>+91 98765 43210</span>
              </a>
              <AccountControl className="text-white font-medium text-sm" />
            </div>

            <Link
              to="/booking"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-center text-sm font-bold uppercase tracking-wider text-white shadow-lg"
            >
              <FiCalendar className="h-4 w-4" />
              <span>Reserve Room Now</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
