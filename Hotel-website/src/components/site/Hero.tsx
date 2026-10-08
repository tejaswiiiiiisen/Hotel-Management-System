import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMenu, FiX, FiChevronRight } from "react-icons/fi";
import WavyLines from "./WavyLines";
import HeroSlider from "./HeroSlider";
import HeaderActions from "./HeaderActions";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Rooms", href: "/rooms" },
  { label: "Services", href: "/services" },
  { label: "Experiences", href: "/experiences" },
  { label: "About", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

export default function Hero() {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden font-jost text-white">
      {/* Auto cross-fading background image slider */}
      <HeroSlider />

      {/* Legibility overlays */}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-black/50 via-black/20 to-transparent" />

      {/* Soft fade to cream section below */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[35vh] bg-gradient-to-t from-cream via-cream/80 to-transparent" />

      {/* Wavy ripple lines */}
      <WavyLines className="pointer-events-none absolute inset-x-0 bottom-[8%] h-[150px] sm:h-[200px] w-full text-white" />

      {/* Top Header Row (Mobile Hamburger & Actions) */}
      <div className="absolute inset-x-0 top-6 z-[1000] px-4 sm:px-10 flex items-center justify-between">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="sm:hidden flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white border border-white/20 transition-colors hover:bg-white/10 cursor-pointer"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
        </button>
        <div className="hidden sm:block" /> {/* spacer for desktop left */}

        <HeaderActions variant="dark" />
      </div>

      {/* Centred Brand Wordmark & Desktop Nav Bar */}
      <div className="pointer-events-none absolute inset-x-0 top-[12vh] sm:top-12 z-20 flex flex-col items-center text-center">
        <h1 className="font-display font-light leading-[0.9] tracking-[0.03em] text-[clamp(48px,11vw,145px)] drop-shadow-lg text-white">
          Hotel
        </h1>

        {/* Refined Luxury Floating Capsule Navigation Bar (Desktop Only) */}
        <nav className="pointer-events-auto mt-6 hidden sm:flex max-w-3xl flex-wrap items-center justify-center gap-1.5 rounded-full bg-black/40 p-1.5 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-300">
          {navItems.map((it) => {
            const active = isActive(it.href);
            return (
              <Link
                key={it.label}
                to={it.href}
                className={`relative px-4 sm:px-5 py-2 text-xs sm:text-[13.5px] font-bold tracking-wide rounded-full transition-all duration-300 ${
                  active
                    ? "bg-white text-slate-900 shadow-md scale-102"
                    : "text-white/80 hover:text-white hover:bg-white/15"
                }`}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[76px] bottom-0 z-[1100] bg-black/90 backdrop-blur-2xl text-white transition-all animate-fadeIn sm:hidden flex flex-col p-6 overflow-y-auto">
          <span className="block mb-4 text-xs font-bold uppercase tracking-widest text-amber-400/80">
            Menu
          </span>
          <div className="flex flex-col space-y-2">
            {navItems.map((link) => {
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
        </div>
      )}
    </section>
  );
}
