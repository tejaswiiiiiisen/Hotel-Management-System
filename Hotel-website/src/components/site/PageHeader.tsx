import { Link, useLocation } from "react-router-dom";
import HeaderActions from "./HeaderActions";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Rooms", href: "/rooms" },
  { label: "Services", href: "/services" },
  { label: "Experiences", href: "/experiences" },
  { label: "About", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

function isActive(pathname: string, href: string) {
  if (!href) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function PageHeader() {
  const pathname = useLocation().pathname;

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_2px_16px_rgba(0,0,0,0.03)] px-4 pt-3.5 pb-3.5 md:pt-5 md:pb-5 sm:px-8 transition-all">
      <div className="flex flex-col items-center">
        {/* Top Row: Centered Wordmark with Actions pinned to the right edge */}
        <div className="relative w-full flex items-center justify-between sm:justify-center px-1 sm:px-2">
          <Link
            to="/"
            className="font-display font-light leading-[0.9] tracking-[0.03em] text-slate-900 text-[32px] sm:text-[clamp(40px,6vw,68px)] transition-opacity hover:opacity-80 select-none"
          >
            Hotel
          </Link>

          <div className="sm:absolute sm:right-0 lg:right-2 sm:top-1/2 sm:-translate-y-1/2 z-20 shrink-0">
            <HeaderActions variant="light" />
          </div>
        </div>

        {/* Floating Pill Navigation Row */}
        <nav className="mt-4 sm:mt-5 flex max-w-full overflow-x-auto scrollbar-none items-center justify-start sm:justify-center gap-1 sm:gap-1.5 rounded-full bg-slate-100/90 p-1 sm:p-1.5 backdrop-blur-md border border-slate-200/80 shadow-xs">
          {navItems.map((it) => {
            const active = isActive(pathname, it.href);

            return (
              <Link
                key={it.label}
                to={it.href}
                aria-current={active ? "page" : undefined}
                className={`relative shrink-0 px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-[13.5px] font-bold tracking-wide rounded-full transition-all duration-300 ${
                  active
                    ? "bg-slate-900 text-white shadow-sm shadow-slate-900/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                }`}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
