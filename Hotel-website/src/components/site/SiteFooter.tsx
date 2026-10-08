import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FaInstagram, FaFacebookF, FaCloudSun, FaGoogle } from "react-icons/fa";
import DiscoverCards from "./DiscoverCards";
import WavyLines from "./WavyLines";
import { ArrowRight, ArrowUp } from "./icons";

const quickLinks: [string, string][] = [["Jobs", "/contact"], ["Weather", "https://www.google.com/search?q=weather+Weiden+am+See"], ["Location & directions", "https://maps.google.com/?q=Seepark-Feriendorf+1+7121+Weiden+am+See"], ["Downloads", "/offers"], ["About", "/about"], ["Contact Us", "/contact"]];

const awards = [
  "German Design Award 2025",
  "BIG SEE Interior Design 2024",
  "SBID 2024 Finalist",
  "ICONIC Architecture 2024",
  "ICONIC Material 2024",
  "Loxone Award 2024",
];

const legal: [string, string][] = [["Imprint", "/about"], ["Privacy", "/privacy"], ["Privacy settings", "#privacy-settings"], ["Site map", "/"], ["Accessibility", "#accessibility"], ["Report an accessibility barrier", "/contact"]];

function Heading({ children }: { children: ReactNode }) {
  return (
    <h3
      className="text-[34px] font-normal tracking-wide text-white"
      style={{ fontFamily: "var(--font-italiana)" }}
    >
      {children}
    </h3>
  );
}

export default function SiteFooter() {
  const [visitors, setVisitors] = useState<number | null>(null);
  useEffect(() => {
    fetch("http://localhost:4000/api/visitors/visit", { method: "POST", headers: { "Content-Type": "application/json" } }).then((r) => r.json()).then((d) => setVisitors(Number(d.visitors))).catch(() => {});
  }, []);
  return (
    <footer className="relative bg-[#153149] mt-[100px] pt-28 pb-40 text-white">
      {/* Faint ripple lines in the background */}
      <WavyLines className="pointer-events-none absolute inset-x-0 top-[46%] h-[320px] w-full opacity-30" />

      <div className="relative mx-auto max-w-[1400px] px-6  z-20">
        {/* Discover cards straddle the cream / navy boundary */}
        <div className="absolute left-1/2 top-0 z-20 w-full max-w-[1400px] -translate-x-1/2 -translate-y-1/2 px-6">
          <DiscoverCards />
        </div>
        {/* Info columns */}
        <div className="pt-32 md:pt-40 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8 md:gap-y-12 md:grid-cols-3 lg:grid-cols-5 ">
          <div>
            <Heading>Address</Heading>
            <address className="mt-5 space-y-1 font-jost text-[15px] not-italic text-white/85">
              <div>Hotel</div>
              <div>Seepark-Feriendorf 1</div>
              <div>7121 Weiden am See</div>
              <div>India</div>
            </address>
          </div>

          <div>
            <Heading>Contact</Heading>
            <div className="mt-5 space-y-2 font-jost text-[15px] text-white/85">
              <a href="tel:+432167434340" className="block underline-offset-4 hover:underline">
                T +43 2167 434340
              </a>
              <a href="mailto:reservations@hotel.com" className="block underline-offset-4 hover:underline">
                reservations@hotel.com
              </a>
            </div>
            <div className="mt-5 flex gap-3">
              {[FaInstagram, FaFacebookF, FaCloudSun].map((Icon, i) => (
                <span
                  key={i}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/40 text-white/85 transition-colors hover:bg-white hover:text-[#153149]"
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          <div>
            <Heading>Newsletter</Heading>
            <div className="mt-6 flex items-center gap-3">
              <input
                type="email"
                placeholder="Email address"
                className="w-full border-b border-white/40 bg-transparent pb-2 font-jost text-[15px] text-white placeholder-white/60 outline-none focus:border-white"
              />
              <button
                type="button"
                aria-label="Subscribe"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/50 text-white transition-colors hover:bg-white hover:text-[#153149]"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex items-center gap-4 font-jost text-white/85">
              <span className="text-[17px] font-semibold">Booking.com</span>
              <FaGoogle className="h-5 w-5" />
            </div>
          </div>

          <div>
            <Heading>Vouchers</Heading>
            <Link to="/offers" className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/50 px-6 py-3 font-jost text-[15px] text-white transition-colors hover:bg-white hover:text-[#153149]">
              <ArrowRight className="h-4 w-4" />
              Show vouchers
            </Link>
          </div>

          <ul className="space-y-2 font-jost text-[15px] text-white/85 lg:text-right">
            {quickLinks.map(([label, href]) => (
              <li key={label}>
                {href.startsWith("http") ? <a href={href} target="_blank" rel="noreferrer" className="hover:underline">{label}</a> : <Link to={href} className="hover:underline">{label}</Link>}
              </li>
            ))}
          </ul>
        </div>

        {/* Awarded by */}
        <div className="mt-20 text-center">
          <h3
            className="inline-flex items-center gap-3 text-[38px] text-white"
            style={{ fontFamily: "var(--font-italiana)" }}
          >
            Awarded by <ArrowUp className="h-5 w-5" />
          </h3>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {awards.map((a) => (
              <span
                key={a}
                className="grid h-16 w-24 md:h-20 md:w-28 place-items-center rounded-lg bg-white/95 px-3 text-center text-[10px] md:text-[11px] font-semibold leading-tight text-[#153149]"
              >
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Legal */}
        <div className="mt-16 flex flex-col md:flex-row items-center justify-between border-t border-white/20 pt-6 font-jost text-[13px] text-white/70 gap-y-4">
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-2 text-center md:justify-start">
            {legal.map(([label, href], i) => (
              <span key={label} className="inline-flex items-center">
                {href.startsWith("/") ? <Link to={href} className="hover:underline">{label}</Link> : <a href={href} className="hover:underline">{label}</a>}
                {i < legal.length - 1 && <span className="px-2 text-white/40 hidden md:inline">|</span>}
                {i < legal.length - 1 && <span className="px-1 text-white/40 md:hidden">•</span>}
              </span>
            ))}
          </div>
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
            <span className="font-semibold text-white/90">&copy; 2026 Hotel</span>
            <span className="font-semibold text-white/90">Visitors: {visitors ?? "—"}</span>
          </div>
        </div>

        <div className="mt-12 text-center font-jost text-[13px] text-white/70">
          <div>powered by</div>
          <div className="text-[18px] font-semibold text-white">Hotel</div>
        </div>
      </div>
    </footer>
  );
}
